const { Collection, PermissionFlagsBits, SlashCommandBuilder, ContextMenuCommandBuilder } = require('discord.js');
const { shortenText } = require('../func');
const { readdirSync } = require('fs');

/**
 * @typedef {import('discord.js').SlashCommandBooleanOption
 *         | import('discord.js').SlashCommandChannelOption
 *         | import('discord.js').SlashCommandIntegerOption
 *         | import('discord.js').SlashCommandMentionableOption
 *         | import('discord.js').SlashCommandNumberOption
 *         | import('discord.js').SlashCommandRoleOption
 *         | import('discord.js').SlashCommandStringOption
 *         | import('discord.js').SlashCommandAttachmentOption
 *         | import('discord.js').SlashCommandMentionableOption
 *         | import('discord.js').SlashCommandUserOption
 * } AnySlashCommandOption
 */

/**@satisfies {Record<import('../commands/Commons/cmdOpts').BaseParamType, keyof SlashCommandBuilder>}*/
const addFunctionNames = /**@type {const}*/({
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
});
const defaultAddFunctionName =  'addStringOption';

/**
 * @param {import('discord.js').SlashCommandBuilder} slash
 * @param {import('../commands/Commons/cmdOpts').CommandOptions} options
 */
function setupOptionBuilders(slash, options, log = false) {
    options.params.forEach(p => {
        /**
         * @template {AnySlashCommandOption} T
         * @param {T} option 
         * @param {String} name 
         * @param {Boolean} fullyOptional 
         * @returns {T}
         */
        const optionBuilder = (option, name, fullyOptional = false) => {
            option
                .setName(name)
                .setDescription(p._desc)
                .setRequired(!(fullyOptional || p._optional));

            if(p.hasAutocomplete)
                /**@type {import('discord.js').SlashCommandStringOption}*/(option).setAutocomplete(true);

            return option;
        };

        const addFunctionName = (typeof p._type === 'string')
            ? (addFunctionNames[p._type] ?? defaultAddFunctionName)
            : defaultAddFunctionName;

        if(p._poly === 'SINGLE')
            return slash[addFunctionName](opt => optionBuilder(opt, p._name));
        if(p._poly === 'MULTIPLE') {
            const singularName = p._name.replace(/[Ss]$/, '');
            slash[addFunctionName](opt => optionBuilder(opt, `${singularName}_1`));
            for(let i = 2; i <= p._polymax; i++)
                slash[addFunctionName](opt => optionBuilder(opt, `${singularName}_${i}`, true));
            return;
        }
        return p._poly.forEach(entry => slash[addFunctionName](opt => optionBuilder(opt, `${p._name}_${entry}`)));
    });
    
    options.flags.forEach(f => {
        const addFunctionName = (typeof f._type === 'string')
            ? (addFunctionNames[f._type] ?? defaultAddFunctionName)
            : defaultAddFunctionName;
        
        /**
         * @template {AnySlashCommandOption} T
         * @param {T} option 
         * @returns {T}
         */
        const optionBuilder = (option) => {
            option
                .setName(f._long[0] || f._short[0])
                .setDescription(f._desc)
                .setRequired(false);

            if(f._expressive && /**@type {import('../commands/Commons/cmdOpts').CommandFlagExpressive}*/(f).hasAutocomplete)
                /**@type {import('discord.js').SlashCommandStringOption}*/(option).setAutocomplete(true);

            return option;
        };

        if(f._expressive)
            return slash[addFunctionName](optionBuilder);

        return slash.addBooleanOption(optionBuilder);
    });

    log && console.log(slash.name);
    log && options?.options && console.table([...options.options.entries()].map(([ optionName, option ]) => {
        if(option.isCommandFlag())
            return {
                name: optionName,
                type: option._type,
            };
        
        if(option.isCommandParam())
            return {
                name: optionName,
                type: option._type,
            }

        return {
            name: optionName,
            type: undefined,
        }
    }));
}

const puré = {
    commands   : /**@type {Collection<String, import('../commands/Commons/cmdBuilder').CommandManager>}*/(new Collection()),
    actions    : /**@type {Collection<String, import('../actions/Commons/actionBuilder').ContextMenuActionManager>}*/(new Collection()),
    emotes     : /**@type {Collection<String, import('../commands/Commons/cmdBuilder').CommandManager>}*/(new Collection()),
    slash      : /**@type {Collection<String, import('discord.js').RESTPostAPIChatInputApplicationCommandsJSONBody>}*/(new Collection()),
    slashHourai: /**@type {Collection<String, import('discord.js').RESTPostAPIChatInputApplicationCommandsJSONBody>}*/(new Collection()),
    contextMenu: /**@type {Collection<String, import('discord.js').RESTPostAPIContextMenuApplicationCommandsJSONBody>}*/(new Collection()),
};

/**
 * @param {Boolean} log 
 */
function registerCommandFiles(log = false) {
    const commandFiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
    /**@type {{ name: string, flags: string, tieneEmote: string, tieneMod: string }[]}*/
    const commandTableStack = [];
    
    for(const file of commandFiles) {
        const commandModule = require(`../commands/Pure/${file}`);
        /**@type {import('../commands/Commons/cmdBuilder').CommandManager}*/
        const command = commandModule;
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
            .setDMPermission(false);
        
        if(command.flags.has('MOD'))
            slash.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageMessages);
    
        /**@type {import('../commands/Commons/cmdOpts').CommandOptions}*/
        const options = command.options;
        if(options)
            setupOptionBuilders(slash, options, log);
    
        const jsonData = slash.toJSON();
        if(!command.flags.has('SAKI'))
            puré.slash.set(command.name, jsonData);
        else
            puré.slashHourai.set(command.name, jsonData);
    }

    log && console.table(commandTableStack);
    
    const actionFiles = readdirSync('./actions/Instances').filter(file => file.endsWith('.js'));
    /**@type {{ name: String, type: String, tid: String }[]}*/
    const actionTableStack = [];

    for(const file of actionFiles) {
        const actionModule = require(`../actions/Instances/${file}`);
        /**@type {import('../actions/Commons/actionBuilder').ContextMenuActionManager}*/
        const action = actionModule;
        puré.actions.set(action.name, action);
        
        log && actionTableStack.push({
            name: action.name,
            type: `${action.type}`,
            tid: null,
        });

        const contextMenu = new ContextMenuCommandBuilder()
            .setName(action.name)
            .setType(/**@type {import('discord.js').ContextMenuCommandType}*/(action.type))
            .setDMPermission(false);

        for(const [ localeId, localizedName ] of action.localizations)
            contextMenu.setNameLocalization(localeId, localizedName);

        puré.contextMenu.set(action.name, contextMenu.toJSON());
    }

    log && console.table(actionTableStack);
}

module.exports = {
    registerCommandFiles,
    puré,
};
