import type { SlashCommandStringOption } from 'discord.js';
import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { BaseParamType } from 'types/commands';
import type { Command, CommandOptions } from '@/commands/commons';
import puré from '@/core/puréRegistry';
import { UnexpectedValueError } from '@/errors/unexpectedValue';
import { shortenText } from '@/func';
import type { AnySlashCommandOption, SlashCommandBuilderAddFunctionName } from '@/types/discord';

interface CommandRegistryLogTableRow {
	name: string;
	flags: string;
	tieneEmote: string;
	tieneMod: string;
}

export function registerCommands(commands: Command[], log: boolean = false) {
	const commandTableStack: CommandRegistryLogTableRow[] = [];

	for (const command of commands) {
		puré.commands.set(command.name, command);

		log
			&& commandTableStack.push({
				name: command.name,
				flags: command.flags.keys.join(', '),
				tieneEmote: command.flags.has('EMOTE') ? '✅' : '❌',
				tieneMod: command.flags.has('MOD') ? '✅' : '❌',
			});

		if (command.flags.has('EMOTE')) puré.emotes.set(command.name, command);

		if (command.flags.any('PAPA', 'OUTDATED', 'MAINTENANCE', 'GUIDE')) continue;

		const slash = new SlashCommandBuilder()
			.setName(command.name)
			.setDescription(command.brief || shortenText(command.desc ?? 'Sin descripción.', 100))
			.setContexts(InteractionContextType.Guild);

		if (command.flags.has('MOD'))
			slash.setDefaultMemberPermissions(
				PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageMessages,
			);

		const options: CommandOptions | undefined = command.options;
		if (options) setupOptionBuilders(slash, options, log);

		const jsonData = slash.toJSON();
		puré.slash.set(command.name, jsonData);
	}

	log && console.table(commandTableStack);
}

const addFunctionNames: Record<BaseParamType, SlashCommandBuilderAddFunctionName> = {
	NUMBER: 'addNumberOption',
	USER: 'addUserOption',
	MEMBER: 'addUserOption',
	ROLE: 'addRoleOption',
	CHANNEL: 'addChannelOption',
	ID: 'addIntegerOption',
	EMOTE: 'addStringOption',
	FILE: 'addAttachmentOption',
	IMAGE: 'addAttachmentOption',
	GUILD: 'addStringOption',
	MESSAGE: 'addStringOption',
	TEXT: 'addStringOption',
	URL: 'addStringOption',
	DATE: 'addStringOption',
	TIME: 'addStringOption',
} as const;

const defaultAddFunctionName: SlashCommandBuilderAddFunctionName = 'addStringOption';

function setupOptionBuilders(slash: SlashCommandBuilder, options: CommandOptions, log = false) {
	options.params.forEach((param) => {
		const optionBuilder = <T extends AnySlashCommandOption>(
			option: T,
			name: string,
			fullyOptional: boolean = false,
		): T => {
			option
				.setName(name)
				.setDescription(param.desc ?? 'Sin descripción.')
				.setRequired(!(fullyOptional || param.optional));

			if (param.hasAutocomplete) (option as SlashCommandStringOption).setAutocomplete(true);

			return option;
		};

		const addFunctionName =
			typeof param.type === 'string'
				? (addFunctionNames[param.type] ?? defaultAddFunctionName)
				: defaultAddFunctionName;

		if (param.poly === 'SINGLE')
			// biome-ignore lint/suspicious/noExplicitAny: Hay que confiar en el proceso
			return slash[addFunctionName]((opt: any) => optionBuilder(opt, param.name));
		if (param.poly === 'MULTIPLE') {
			const singularName = param.name.replace(/[Ss]$/, '');
			// biome-ignore lint/suspicious/noExplicitAny: Hay que confiar en el proceso
			slash[addFunctionName]((opt: any) => optionBuilder(opt, `${singularName}_1`));
			for (let i = 2; i <= param.polymax; i++)
				// biome-ignore lint/suspicious/noExplicitAny: Hay que confiar en el proceso
				slash[addFunctionName]((opt: any) =>
					optionBuilder(opt, `${singularName}_${i}`, true),
				);
			return;
		}
		return param.poly.forEach((entry) =>
			// biome-ignore lint/suspicious/noExplicitAny: Hay que confiar en el proceso
			slash[addFunctionName]((opt: any) => optionBuilder(opt, `${param.name}_${entry}`)),
		);
	});

	options.flags.forEach((f) => {
		const addFunctionName =
			typeof f.type === 'string'
				? ((addFunctionNames as Record<string, SlashCommandBuilderAddFunctionName>)[f.type]
					?? defaultAddFunctionName)
				: defaultAddFunctionName;

		const optionBuilder = <T extends AnySlashCommandOption>(option: T): T => {
			if (f.long && !Array.isArray(f.long))
				throw new UnexpectedValueError(
					`Malformed long command flags for option: ${option.name}`,
					{
						expected: 'string[]',
						received: f.long,
					},
				);

			if (f.short && typeof f !== 'string' && !Array.isArray(f.short))
				throw new UnexpectedValueError(
					`Malformed short command flags for option: ${option.name}`,
					{
						expected: 'string[]',
						received: f.long,
					},
				);

			if (!f.long && !f.short) throw new Error('Malformed command flags.');

			option
				.setName(f.long?.[0] || (f.short?.[0] as string))
				.setDescription(f.desc ?? 'Sin descripción.')
				.setRequired(false);

			if (f.isExpressive() && f.hasAutocomplete)
				(option as SlashCommandStringOption).setAutocomplete(true);

			return option;
		};

		//@ts-expect-error Hay que confiar en el proceso.
		if (f.isExpressive()) return slash[addFunctionName](optionBuilder);

		return slash.addBooleanOption(optionBuilder);
	});

	log && console.log(slash.name);
	log
		&& options?.options
		&& console.table(
			[...options.options.entries()].map(([optionName, option]) => {
				if (option.isCommandFlag())
					return {
						name: optionName,
						type: option.type,
					};

				if (option.isCommandParam())
					return {
						name: optionName,
						type: option.type,
					};

				return {
					name: optionName,
					type: undefined,
				};
			}),
		);
}
