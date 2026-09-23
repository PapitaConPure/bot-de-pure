import { ContainerBuilder, type Message, MessageFlags } from 'discord.js';
import puré from '@/core/puréRegistry';
import { type PrefixPair, tenshiAltColor, tenshiColor } from '@/data/globalProps';
import unknownCommandReplies from '@/data/unknownCommandReplies.json';
import { Translator } from '@/i18n';
import { auditRequest } from '@/systems/others/auditor';
import Logger from '@/utils/logs';
import { edlDistance } from '@/utils/misc';
import { p_pure } from '@/utils/prefixes';
import { rand } from '@/utils/random';
import { CommandOptionSolver, type CommandOptions } from './cmdOpts';
import { Command } from './commandBuilder';
import {
	findFirstCommandExclusion,
	generateCommandExclusionEmbed,
	handleAndAuditError,
} from './commandExceptions';
import { type CommandResult, CommandResults } from './commandProcessing';

const { error } = Logger('WARN', 'MessageCommand');

export async function processMessageCommand(message: Message<true>): Promise<CommandResult> {
	const { content, guildId } = message;
	const ppure = p_pure(guildId);

	if (!content.toLowerCase().match(ppure.regex)) return CommandResults.VOID;

	auditRequest(message);

	const args = content.replace(ppure.regex, '').split(/[\n ]+/);
	const commandName = args.shift()?.toLowerCase();

	if (!commandName) {
		const translator = await Translator.fromUser(message.author);
		message.reply(translator.getText('invalidEmptyCommandName'));
		return CommandResults.VOID;
	}

	const command =
		puré.commands.get(commandName)
		|| puré.commands.find((cmd) => cmd.aliases?.includes(commandName));

	if (!command) return handleInvalidCommand(message, commandName, ppure);

	const rawArgs = content.slice(content.indexOf(commandName) + commandName.length).trim();
	try {
		await handleMessageCommand(message, command, args, rawArgs, `${ppure.raw}${commandName}`);
		return CommandResults.SUCCEEDED;
	} catch (error) {
		handleMessageCommandError(error, message, commandName, args);
		return CommandResults.FAILED;
	}
}

async function handleInvalidCommand(
	message: Message<true>,
	commandName: string,
	prefixPair: PrefixPair,
): Promise<CommandResult> {
	const { text, imageUrl } = unknownCommandReplies[rand(unknownCommandReplies.length)];
	const processedText = text.replaceAll('%COMMAND', commandName);

	async function replyAndDelete() {
		try {
			const notice = await message.reply({
				content: processedText,
			});
			setTimeout(() => notice?.delete().catch(() => undefined), 6000);
		} catch (err) {
			error(err);
		}

		return CommandResults.VOID;
	}

	if (commandName.length < 2) return replyAndDelete();

	const allowedGuesses = puré.commands.filter((cmd) => !cmd.flags.any('OUTDATED', 'MAINTENANCE'));
	const foundList: { command: Command<CommandOptions | undefined>; distance: number }[] = [];
	for (const [cmn, cmd] of allowedGuesses) {
		const distances = [cmn, ...(cmd.aliases?.filter((a) => a.length > 1) ?? [])].map((c) => ({
			n: c,
			d: edlDistance(commandName, c),
		}));
		const lowestDistance = Math.min(...distances.map((d) => d.d));
		if (lowestDistance < 3) foundList.push({ command: cmd, distance: lowestDistance });
	}

	const translator = await Translator.fromUser(message.author.id);

	const suggestions = [
		...new Map(
			foundList.map((found) => [found.command.localizedNames[translator.locale], found]),
		),
	]
		.map(([, found]) => found)
		.sort((a, b) => a.distance - b.distance)
		.slice(0, 5);

	if (!suggestions.length) return replyAndDelete();

	const mockEmbed = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addSectionComponents((section) =>
			section
				.addTextDisplayComponents((textDisplay) => textDisplay.setContent(processedText))
				.setThumbnailAccessory((thumbnail) => thumbnail.setURL(imageUrl)),
		);

	const suggestionEmbed = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents(
			(textDisplay) => textDisplay.setContent(`### -# Comandos similares a "${commandName}"`),
			(textDisplay) =>
				textDisplay.setContent(
					suggestions
						.map(
							(found) =>
								`* ${prefixPair.raw}${found.command.localizedNames[translator.locale]}`,
						)
						.join('\n'),
				),
			(textDisplay) => textDisplay.setContent('-# Basado en nombres y alias de comando'),
		);

	message.reply({
		flags: MessageFlags.IsComponentsV2,
		components: [mockEmbed, suggestionEmbed],
	});

	return CommandResults.VOID;
}

async function handleMessageCommand(
	message: Message<true>,
	command: Command<CommandOptions | undefined>,
	args: string[],
	rawArgs?: string,
	requestString?: string,
): Promise<void> {
	const satisfiesPermissions = await handleCommandPermissions(message, command, requestString);
	if (!satisfiesPermissions) return;

	const satisfiesExceptions = await handleMessageCommandExclusions(
		message,
		command,
		requestString,
	);
	if (!satisfiesExceptions) return;

	const request = Command.requestize(message);

	if (command.hasOptions()) {
		const solver = new CommandOptionSolver(request, args, command.options, rawArgs);
		await command.execute(request, solver, rawArgs);
	} else if (command.hasNoOptions() /*Inferencia*/) {
		await command.execute(request);
	}
}

async function handleCommandPermissions(
	message: Message<true>,
	command: Command<CommandOptions | undefined>,
	requestString?: string,
): Promise<boolean> {
	if (!command.permissions) return true;

	if (!message.member || !command.permissions.isAllowedIn(message.member, message.channel)) {
		if (!requestString) return false;

		const translator = await Translator.fromUser(message.author);
		await message.channel.send({
			embeds: [
				generateCommandExclusionEmbed(
					{
						title: translator.getText('missingMemberChannelPermissionsTitle'),
						desc: translator.getText('missingMemberChannelPermissionsDescription'),
					},
					{ cmdString: requestString },
				).addFields({
					name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
					value: command.permissions.requisiteTreeString,
				}),
			],
		});

		return false;
	}

	if (!command.permissions.amAllowedIn(message.channel)) {
		if (!requestString) return false;

		const translator = await Translator.fromUser(message.member);
		message.channel.send({
			embeds: [
				generateCommandExclusionEmbed(
					{
						title: translator.getText('missingMemberChannelPermissionsTitle'),
						desc: translator.getText('missingClientChannelPermissionsDescription'),
					},
					{ cmdString: requestString },
				).addFields({
					name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
					value: command.permissions.requisiteTreeString,
				}),
			],
		});

		return false;
	}

	return true;
}

async function handleMessageCommandExclusions(
	message: Message<true>,
	command: Command<CommandOptions | undefined>,
	requestString?: string,
): Promise<boolean> {
	const exception = await findFirstCommandExclusion(command, message);

	if (!exception) return true;

	if (requestString)
		message.channel.send({
			embeds: [generateCommandExclusionEmbed(exception, { cmdString: requestString })],
		});

	return false;
}

function handleMessageCommandError(
	error: Error,
	message: Message<true>,
	commandName: string,
	args: string[],
): CommandResult {
	const isPermissionsError = handleAndAuditError(error, message, {
		details: `"${message.content?.slice(0, 699)}"\n[${commandName} :: ${args}]`,
	});
	return isPermissionsError ? CommandResults.VOID : CommandResults.FAILED;
}
