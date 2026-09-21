import {
	type ApplicationCommandOptionChoiceData,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type Interaction,
	MessageFlags,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import {
	findFirstCommandExclusion,
	generateCommandExclusionEmbed,
	handleAndAuditError,
} from '@/commands/commons/commandExceptions';
import { channelIsBlocked, isUsageBanned } from '@/utils/discord';
import { decompressId } from '@/utils/encoding';
import Logger from '@/utils/logs';
import type { CommandOption, CommandOptions } from '../commands/commons/cmdOpts';
import { CommandOptionSolver } from '../commands/commons/cmdOpts';
import {
	type AnyCommandComponentResponseFunction,
	Command,
} from '../commands/commons/commandBuilder';
import puré from '../core/puréRegistry';
import userIds from '../data/userIds.json';
import { Translator } from '../i18n';
import { type StatsDocument, StatsModel } from '../models/stats';
import { auditRequest } from '../systems/others/auditor';

const { debug, fatal } = Logger('DEBUG', 'Interaction');

export async function onInteraction(interaction: Interaction) {
	if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
		if (await isUsageBanned(interaction.user))
			return handleBlockedInteraction(interaction).catch(console.error);

		return handleComponent(interaction);
	}

	if (!interaction.inCachedGuild())
		return handleBlockedInteraction(interaction).catch(console.error);

	const { channel, user } = interaction;

	if (channelIsBlocked(channel) || (await isUsageBanned(user)))
		return handleBlockedInteraction(interaction).catch(console.error);

	const stats = (await StatsModel.findOne({})) || new StatsModel({ since: Date.now() });

	if (interaction.isAutocomplete()) return handleAutocompleteInteraction(interaction);

	auditRequest(interaction);

	if (interaction.isChatInputCommand()) return handleCommand(interaction, stats);

	if (interaction.isContextMenuCommand()) return handleAction(interaction, stats);

	debug(`Interaction of type «${interaction.type}» is not yet supported.`);
	return handleUnknownInteraction(interaction);
}

async function handleCommand(
	interaction: ChatInputCommandInteraction<'cached'>,
	stats: StatsDocument,
) {
	const { commandName } = interaction;
	const slash = puré.slash.get(commandName);
	if (!slash) return;

	try {
		const command: Command<CommandOptions | undefined> | undefined =
			puré.commands.get(commandName);

		if (!command)
			return fatal(
				new Error(`Command '${commandName}' was not registered before command handling.`),
			);

		if (!interaction.channel) {
			const translator = await Translator.from(interaction.user);
			return interaction.reply({
				content: translator.getText('invalidChannel'),
			});
		}

		debug(
			`Received a genuine Slash Command interaction for "${interaction.commandName}" under the ID: "${interaction.id}".`,
		);

		if (command.permissions) {
			if (!command.permissions.isAllowedIn(interaction.member, interaction.channel)) {
				debug(
					`The Slash Command interaction "${interaction.id}" is not allowed for the requesting member in the source channel.`,
				);

				const translator = await Translator.from(interaction.member);
				return interaction.channel?.send({
					embeds: [
						generateCommandExclusionEmbed(
							{
								title: translator.getText('missingMemberChannelPermissionsTitle'),
								desc: translator.getText(
									'missingMemberChannelPermissionsDescription',
								),
							},
							{ cmdString: `/${commandName}` },
						).addFields({
							name: translator.getText(
								'missingMemberChannelPermissionsFullRequisitesName',
							),
							value: command.permissions.matrix
								.map(
									(requisite, n) =>
										`${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`,
								)
								.join('\n'),
						}),
					],
				});
			}

			if (!command.permissions.amAllowedIn(interaction.channel)) {
				debug(
					`The Slash Command interaction "${interaction.id}" is not allowed in the source channel.`,
				);

				const translator = await Translator.from(interaction.member);
				return interaction.channel.send({
					embeds: [
						generateCommandExclusionEmbed(
							{
								title: translator.getText('missingMemberChannelPermissionsTitle'),
								desc: translator.getText(
									'missingClientChannelPermissionsDescription',
								),
							},
							{ cmdString: `/${commandName}` },
						).addFields({
							name: translator.getText(
								'missingMemberChannelPermissionsFullRequisitesName',
							),
							value: command.permissions.matrix
								.map(
									(requisite, n) =>
										`${n + 1}. ${requisite.map((p) => `\`${p}\``).join(' **o** ')}`,
								)
								.join('\n'),
						}),
					],
				});
			}
		}

		const exception = await findFirstCommandExclusion(command, interaction);
		if (exception) {
			debug(
				`The Slash Command interaction "${interaction.id}" is not authorized in the current context.`,
			);
			return interaction.reply({
				embeds: [generateCommandExclusionEmbed(exception, { cmdString: `/${commandName}` })],
				flags: MessageFlags.Ephemeral,
			});
		}

		debug(
			`The Slash Command interaction "${interaction.id}" is authorized and the associated Command will execute promptly.`,
		);
		const request = Command.requestize(interaction);
		if (command.hasOptions()) {
			const solver = new CommandOptionSolver(request, interaction.options, command.options);
			await command.execute(request, solver);
		} else if (command.hasNoOptions() /*Inferencia*/) {
			await command.execute(request);
		}
		stats.commands.succeeded++;
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `/${commandName}`,
		});
		if (!isPermissionsError) stats.commands.failed++;
	}

	stats.markModified('commands');
	return stats.save();
}

async function handleAction(
	interaction: ContextMenuCommandInteraction<'cached'>,
	stats: StatsDocument,
) {
	const { commandName } = interaction;

	const contextMenu = puré.contextMenu.get(commandName);
	if (!contextMenu) return;

	try {
		const action = puré.actions.get(commandName);

		if (!action)
			return fatal(
				new Error(`Action '${commandName}' was not registered before action handling.`),
			);

		debug(
			`Received a genuine context menu interaction for "${interaction.commandName}" under the ID: "${interaction.id}". The associated Action will execute promptly.`,
		);

		await action.execute(interaction);
		stats.commands.succeeded++;
	} catch (error) {
		//@ts-expect-error Da un poco igual las propiedades por las que se queja TypeScript
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `/${commandName}`,
		});
		if (!isPermissionsError) stats.commands.failed++;
	}

	stats.markModified('commands');
	return stats.save();
}

async function handleComponent(interaction: AnyCommandInteraction) {
	if (!interaction.customId) {
		debug(
			`Interaction under the ID: "${interaction.id}" didn't have a custom ID, which is a requirement for a valid Component interaction. Exiting.`,
		);
		return handleUnknownInteraction(interaction);
	}

	if (interaction.customId.startsWith('/')) {
		const stream = interaction.customId.slice(1).split('_');
		const commandName = stream.shift();
		const authorId = stream.shift();

		if (!commandName || !authorId) {
			debug(
				`Component Interaction under the ID: "${interaction.id}" had a malformed custom ID: "${interaction.customId}".`,
			);
			return handleUnknownInteraction(interaction);
		}

		if (interaction.user.id !== decompressId(authorId)) {
			debug(
				`The Component interaction "${interaction.id}" is not authorized for the requesting user.`,
			);
			const translator = await Translator.from(interaction.user.id);
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});
		}

		const command: Command<CommandOptions | undefined> | undefined =
			puré.commands.get(commandName)
			|| puré.commands.find((cmd) => cmd.aliases?.includes(commandName));

		if (command == null)
			return fatal(new ReferenceError(`Command "${commandName}" does not exist.`));

		const request = Command.requestize(interaction);
		if (command.hasOptions()) {
			const solver = new CommandOptionSolver(
				request,
				stream,
				command.options,
				stream.join(' '),
			);
			return command.execute(request, solver);
		} else if (command.hasNoOptions()) return command.execute(request);
	}

	try {
		const funcStream: string[] = interaction.customId.split('_');
		const commandName = funcStream.shift();
		const commandFnName = funcStream.shift();

		if (!commandName || !commandFnName) {
			debug(
				`Component Interaction under the ID: "${interaction.id}" had a malformed custom ID: "${interaction.customId}".`,
			);
			return handleUnknownInteraction(interaction);
		}

		debug(
			`Received a genuine Component interaction for Command "${commandName}", function "${commandFnName}", under the ID: "${interaction.id}".`,
		);
		debug(
			`The Component interaction "${interaction.id}" has the following arguments: [ ${funcStream.join(', ')} ]`,
		);

		const command =
			puré.commands.get(commandName)
			|| puré.commands.find((cmd) => cmd.aliases?.includes(commandName));

		if (command == null)
			return fatal(new ReferenceError(`Command "${commandName}" does not exist.`));

		if (typeof command[commandFnName] !== 'function') return handleHuskInteraction(interaction);

		const commandFn: AnyCommandComponentResponseFunction = command[commandFnName];

		//Filtros
		const userFilterIndex = commandFn.userFilterIndex;
		if (userFilterIndex != null) {
			if (typeof userFilterIndex !== 'number')
				return fatal(
					new TypeError(
						`Se esperaba un valor numérico como índice de parámetro de interacción para filtro de ID de usuario, pero se recibió: ${userFilterIndex} (${typeof userFilterIndex})`,
					),
				);

			const authorId = funcStream[userFilterIndex];
			if (typeof authorId !== 'string')
				return fatal(
					new RangeError(
						`Se esperaba una ID de usuario en el parámetro de interacción ${userFilterIndex}. Sin embargo, ninguna ID fue recibida en la posición`,
					),
				);

			if (interaction.user.id !== decompressId(authorId)) {
				debug(
					`The Component interaction "${interaction.id}" is not authorized for the requesting user.`,
				);
				const translator = await Translator.from(interaction.user.id);
				return interaction.reply({
					content: translator.getText('unauthorizedInteraction'),
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		debug(
			`The Component interaction "${interaction.id}" is authorized and the associated function will execute promptly.`,
		);

		return commandFn(interaction, ...funcStream);
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `"${interaction.customId}"`,
		});
		if (!isPermissionsError) console.error(error);
	}
}

async function handleAutocompleteInteraction(interaction: AutocompleteInteraction<'cached'>) {
	const { commandName, options } = interaction;
	const focusedOption = options.getFocused(true);

	if (!focusedOption) return;

	const optionName = focusedOption.name;
	const optionValue = focusedOption.value;

	console.log([commandName, optionName, '«?»', optionValue]);

	try {
		const command: Command<CommandOptions | undefined> | undefined =
			puré.commands.get(commandName)
			|| puré.commands.find((cmd) => cmd.aliases?.includes(commandName));
		if (command == null) throw new ReferenceError(`El comando ${commandName} no existe`);
		const option: CommandOption | undefined =
			command.options?.options.get(optionName)
			?? command.options?.options.get(`${optionName.slice(0, optionName.lastIndexOf('_'))}s`)
			?? command.options?.options.get(`${optionName.slice(0, optionName.lastIndexOf('_'))}`);

		const errOption: ApplicationCommandOptionChoiceData = {
			name: 'Ocurrió un error. Disculpa las molestias',
			value: 'BDP_ERR_NOOPTION',
		};

		if (!option) return interaction.respond([errOption]);

		if (!option.isCommandParam() && !option.isCommandFlag())
			return interaction.respond([errOption]);

		if (option.isCommandFlag() && !option.isExpressive())
			return interaction.respond([errOption]);

		return option.autocomplete(interaction, optionValue);
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `"${optionName}"`,
		});
		if (!isPermissionsError) console.error(error);
	}
}

async function handleBlockedInteraction(interaction: Interaction) {
	const translator = await Translator.from(interaction.user.id);
	if (interaction.isRepliable()) {
		return interaction.reply({
			content: translator.getText('blockedInteraction', userIds.papita),
			flags: MessageFlags.Ephemeral,
		});
	} else {
		return interaction.respond([]);
	}
}

async function handleUnknownInteraction(interaction: Interaction) {
	const translator = await Translator.from(interaction.user.id);
	if (interaction.isRepliable()) {
		return interaction.reply({
			content: translator.getText('unknownInteraction'),
			flags: MessageFlags.Ephemeral,
		});
	} else {
		return interaction.respond([]);
	}
}

async function handleHuskInteraction(interaction: Interaction) {
	const translator = await Translator.from(interaction.user.id);
	if (interaction.isRepliable()) {
		return interaction.reply({
			content: translator.getText('huskInteraction'),
			flags: MessageFlags.Ephemeral,
		});
	} else {
		return interaction.respond([]);
	}
}
//#endregion
