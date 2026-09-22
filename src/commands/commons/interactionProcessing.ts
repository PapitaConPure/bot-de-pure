import {
	type ApplicationCommandOptionChoiceData,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type Interaction,
	MessageFlags,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import {
	findFirstCommandExclusion,
	generateCommandExclusionEmbed,
	handleAndAuditError,
} from '@/commands/commons/commandExceptions';
import puré from '@/core/puréRegistry';
import userIds from '@/data/userIds.json';
import { Translator } from '@/i18n';
import { decompressId } from '@/utils/encoding';
import Logger from '@/utils/logs';
import type { CommandOption, CommandOptions } from './cmdOpts';
import { CommandOptionSolver } from './cmdOpts';
import { type AnyCommandComponentResponseFunction, Command } from './commandBuilder';
import { type CommandResult, CommandResults } from './commandProcessing';

const { debug, fatal } = Logger('WARN', 'InteractionCommand');

export async function handleSlashCommand(
	interaction: ChatInputCommandInteraction<'cached'>,
): Promise<CommandResult> {
	const { commandName } = interaction;
	const slash = puré.slash.get(commandName);

	if (!slash) return CommandResults.VOID;

	try {
		const command: Command<CommandOptions | undefined> | undefined =
			puré.commands.get(commandName);

		if (!command)
			return fatal(
				new Error(`Command '${commandName}' was not registered before command handling.`),
			);

		if (!interaction.channel) {
			const translator = await Translator.fromUser(interaction.user);
			interaction.reply({
				content: translator.getText('invalidChannel'),
			});
			return CommandResults.VOID;
		}

		debug(
			`Received a genuine Slash Command interaction for "${interaction.commandName}" under the ID: "${interaction.id}".`,
		);

		if (command.permissions) {
			if (!command.permissions.isAllowedIn(interaction.member, interaction.channel)) {
				debug(
					`The Slash Command interaction "${interaction.id}" is not allowed for the requesting member in the source channel.`,
				);

				const translator = await Translator.fromUser(interaction.member);
				interaction.channel?.send({
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
				return CommandResults.VOID;
			}

			if (!command.permissions.amAllowedIn(interaction.channel)) {
				debug(
					`The Slash Command interaction "${interaction.id}" is not allowed in the source channel.`,
				);

				const translator = await Translator.fromUser(interaction.member);
				interaction.channel.send({
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
				return CommandResults.VOID;
			}
		}

		const exclusion = await findFirstCommandExclusion(command, interaction);
		if (exclusion) {
			debug(
				`The Slash Command interaction "${interaction.id}" is not authorized in the current context.`,
			);
			interaction.reply({
				embeds: [
					generateCommandExclusionEmbed(exclusion, { cmdString: `/${commandName}` }),
				],
				flags: MessageFlags.Ephemeral,
			});
			return CommandResults.VOID;
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

		return CommandResults.SUCCEEDED;
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `/${commandName}`,
		});
		if (!isPermissionsError) return CommandResults.FAILED;
	}

	return CommandResults.VOID;
}

export async function handleComponent(interaction: AnyCommandInteraction): Promise<void> {
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
			const translator = await Translator.fromUser(interaction.user.id);
			await interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});
			return;
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
			await command.execute(request, solver);
		} else if (command.hasNoOptions()) await command.execute(request);
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
				const translator = await Translator.fromUser(interaction.user.id);
				await interaction.reply({
					content: translator.getText('unauthorizedInteraction'),
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}

		debug(
			`The Component interaction "${interaction.id}" is authorized and the associated function will execute promptly.`,
		);

		await commandFn(interaction, ...funcStream);
		return;
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `"${interaction.customId}"`,
		});
		if (!isPermissionsError) console.error(error);
	}
}

export async function handleAutocompleteInteraction(
	interaction: AutocompleteInteraction<'cached'>,
): Promise<void> {
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

		await option.autocomplete(interaction, optionValue);
	} catch (error) {
		const isPermissionsError = handleAndAuditError(error, interaction, {
			details: `"${optionName}"`,
		});
		if (!isPermissionsError) console.error(error);
	}
}

export async function handleBlockedInteraction(interaction: Interaction): Promise<void> {
	const translator = await Translator.fromUser(interaction.user.id);
	if (interaction.isRepliable()) {
		await interaction.reply({
			content: translator.getText('blockedInteraction', userIds.papita),
			flags: MessageFlags.Ephemeral,
		});
	} else {
		await interaction.respond([]);
	}
}

export async function handleUnknownInteraction(interaction: Interaction): Promise<void> {
	const translator = await Translator.fromUser(interaction.user.id);
	if (interaction.isRepliable()) {
		await interaction.reply({
			content: translator.getText('unknownInteraction'),
			flags: MessageFlags.Ephemeral,
		});
	} else {
		await interaction.respond([]);
	}
}

async function handleHuskInteraction(interaction: Interaction): Promise<void> {
	const translator = await Translator.fromUser(interaction.user.id);
	if (interaction.isRepliable()) {
		await interaction.reply({
			content: translator.getText('huskInteraction'),
			flags: MessageFlags.Ephemeral,
		});
	} else {
		await interaction.respond([]);
	}
}
