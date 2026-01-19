import { Collection, PermissionFlagsBits, SlashCommandBuilder, ContextMenuCommandBuilder, RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody, SlashCommandStringOption, ContextMenuCommandType, InteractionContextType } from 'discord.js';
import { shortenText } from '../func';
import { readdirSync } from 'fs';
import { Command } from '../commands/Commons/cmdBuilder';
import { ContextMenuAction } from '../actions/Commons/actionBuilder';
import { BaseParamType, CommandOptions } from '../commands/Commons/cmdOpts';

export type AnySlashCommandOption = import('discord.js').SlashCommandBooleanOption |
    import('discord.js').SlashCommandChannelOption |
    import('discord.js').SlashCommandIntegerOption |
    import('discord.js').SlashCommandMentionableOption |
    import('discord.js').SlashCommandNumberOption |
    import('discord.js').SlashCommandRoleOption |
    import('discord.js').SlashCommandStringOption |
    import('discord.js').SlashCommandAttachmentOption |
    import('discord.js').SlashCommandMentionableOption |
    import('discord.js').SlashCommandUserOption;

export type SlashCommandBuilderAddFunctionName = keyof SlashCommandBuilder & `add${string}`;

const addFunctionNames: Record<BaseParamType, SlashCommandBuilderAddFunctionName> = ({
	NUMBER:  'addNumberOption',
	USER:    'addUserOption',
	MEMBER:  'addUserOption',
	ROLE:    'addRoleOption',
	CHANNEL: 'addChannelOption',
	ID:      'addIntegerOption',
	EMOTE:   'addStringOption',
	FILE:    'addAttachmentOption',
	IMAGE:   'addAttachmentOption',
	GUILD:   'addStringOption',
	MESSAGE: 'addStringOption',
	TEXT:    'addStringOption',
	URL:     'addStringOption',
	DATE:    'addStringOption',
	TIME:    'addStringOption',
}) as const;

const defaultAddFunctionName: SlashCommandBuilderAddFunctionName =  'addStringOption';

function setupOptionBuilders(slash: SlashCommandBuilder, options: import('../commands/Commons/cmdOpts').CommandOptions, log = false) {
	options.params.forEach(p => {
		const optionBuilder = <T extends AnySlashCommandOption>(option: T, name: string, fullyOptional: boolean = false): T => {
			option
				.setName(name)
				.setDescription(p.desc)
				.setRequired(!(fullyOptional || p.optional));

			if(p.hasAutocomplete)
				(option as SlashCommandStringOption).setAutocomplete(true);

			return option;
		};

		const addFunctionName = (typeof p.type === 'string')
			? (addFunctionNames[p.type] ?? defaultAddFunctionName)
			: defaultAddFunctionName;

		if(p.poly === 'SINGLE')
			return slash[addFunctionName](opt => optionBuilder(opt, p.name));
		if(p.poly === 'MULTIPLE') {
			const singularName = p.name.replace(/[Ss]$/, '');
			slash[addFunctionName](opt => optionBuilder(opt, `${singularName}_1`));
			for(let i = 2; i <= p.polymax; i++)
				slash[addFunctionName](opt => optionBuilder(opt, `${singularName}_${i}`, true));
			return;
		}
		return p.poly.forEach(entry => slash[addFunctionName](opt => optionBuilder(opt, `${p.name}_${entry}`)));
	});

	options.flags.forEach(f => {
		const addFunctionName = (typeof f.type === 'string')
			? (addFunctionNames[f.type] ?? defaultAddFunctionName)
			: defaultAddFunctionName;

		const optionBuilder = <T extends AnySlashCommandOption>(option: T): T => {
			option
				.setName(f.long[0] || f.short[0])
				.setDescription(f.desc)
				.setRequired(false);

			if(f.isExpressive() && f.hasAutocomplete)
				(option as SlashCommandStringOption).setAutocomplete(true);

			return option;
		};

		if(f.isExpressive())
			return slash[addFunctionName](optionBuilder);

		return slash.addBooleanOption(optionBuilder);
	});

	log && console.log(slash.name);
	log && options?.options && console.table([ ...options.options.entries() ].map(([ optionName, option ]) => {
		if(option.isCommandFlag())
			return {
				name: optionName,
				type: option.type,
			};

		if(option.isCommandParam())
			return {
				name: optionName,
				type: option.type,
			};

		return {
			name: optionName,
			type: undefined,
		};
	}));
}

export const puré = {
	commands   : new Collection<string, Command>(),
	actions    : new Collection<string, ContextMenuAction>(),
	emotes     : new Collection<string, Command>(),
	slash      : new Collection<string, RESTPostAPIChatInputApplicationCommandsJSONBody>(),
	slashSaki  : new Collection<string, RESTPostAPIChatInputApplicationCommandsJSONBody>(),
	contextMenu: new Collection<string, RESTPostAPIContextMenuApplicationCommandsJSONBody>(),
};

export function registerCommands(commands: Command[], log: boolean = false) {
    /**@type {{ name: string, flags: string, tieneEmote: string, tieneMod: string }[]}*/
	const commandTableStack: { name: string; flags: string; tieneEmote: string; tieneMod: string; }[] = [];

	for(const command of commands) {
		puré.commands.set(command.name, command);

		log && commandTableStack.push({
			name: command.name,
			flags: command.flags.keys.join(', '),
			tieneEmote: command.flags.has('EMOTE') ? '✅' : '❌',
			tieneMod: command.flags.has('MOD') ? '✅' : '❌',
		});

		if(command.flags.has('EMOTE'))
			puré.emotes.set(command.name, command);

		if(command.flags.any('PAPA', 'OUTDATED', 'MAINTENANCE', 'GUIDE'))
			continue;

		const slash = new SlashCommandBuilder()
			.setName(command.name)
			.setDescription(command.brief || shortenText(command.desc, 100))
			.setContexts(InteractionContextType.Guild);

		if(command.flags.has('MOD'))
			slash.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageMessages);

		const options: CommandOptions = command.options;
		if(options)
			setupOptionBuilders(slash, options, log);

		const jsonData = slash.toJSON();
		if(!command.flags.has('SAKI'))
			puré.slash.set(command.name, jsonData);
		else
			puré.slashSaki.set(command.name, jsonData);
	}

	log && console.table(commandTableStack);

	const actionFiles = readdirSync('./actions/Instances').filter(file => /\.(js|ts)$/.test(file));
	const actionTableStack: { name: string; type: string; tid: string; }[] = [];

	for(const file of actionFiles) {
		const actionModule = require(`../actions/Instances/${file}`);
		const action: ContextMenuAction = actionModule instanceof ContextMenuAction ? actionModule : actionModule.default;
		puré.actions.set(action.name, action);

		log && actionTableStack.push({
			name: action.name,
			type: `${action.type}`,
			tid: null,
		});

		const contextMenu = new ContextMenuCommandBuilder()
			.setName(action.name)
			.setType(action.type as ContextMenuCommandType)
			.setDMPermission(false);

		for(const [ localeId, localizedName ] of action.localizations)
			contextMenu.setNameLocalization(localeId, localizedName);

		puré.contextMenu.set(action.name, contextMenu.toJSON());
	}

	log && console.table(actionTableStack);
}
