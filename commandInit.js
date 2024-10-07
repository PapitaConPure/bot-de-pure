const { Collection, PermissionFlagsBits, SlashCommandBuilder, Client, ContextMenuCommandBuilder } = require('discord.js');
const { CommandManager, CommandOptions, CommandFlagExpressive } = require('./commands/Commons/commands.js');
const { shortenText } = require('./func.js');
const { readdirSync } = require('fs');
const { ContextMenuActionManager } = require('./actions/Commons/actionBuilder.js');

/**+
 * @typedef {import('discord.js').SlashCommandBooleanOption
 *         | import('discord.js').SlashCommandChannelOption
 *         | import('discord.js').SlashCommandIntegerOption
 *         | import('discord.js').SlashCommandMentionableOption
 *         | import('discord.js').SlashCommandNumberOption
 *         | import('discord.js').SlashCommandRoleOption
 *         | import('discord.js').SlashCommandStringOption
 *         | import('discord.js').SlashCommandUserOption
 * } AnySlashCommandOption
 */

/**
 * @param {import('discord.js').SlashCommandBuilder} slash
 * @param {CommandOptions} options
 */
function setupOptionBuilders(slash, options) {
    /**@type {{ [K in import('./commands/Commons/cmdOpts.js').BaseParamType]: String }}*/
    const addFunctionNames = /**@type {const}*/({
        NUMBER:  'addNumberOption',
        USER:    'addUserOption',
        MEMBER:  'addUserOption',
        ROLE:    'addRoleOption',
        CHANNEL: 'addChannelOption',
        ID:      'addIntegerOption',
        EMOTE:   'addStringOption',
        FILE:    'addStringOption',
        GUILD:   'addStringOption',
        IMAGE:   'addStringOption',
        MESSAGE: 'addStringOption',
        TEXT:    'addStringOption',
        URL:     'addStringOption',
    });
    const defaultAddFunctionName =  'addStringOption';

    options.params.forEach(p => {
        /**
         * @param {AnySlashCommandOption} option 
         * @param {String} name 
         * @param {Boolean} fullyOptional 
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
         * @param {AnySlashCommandOption} option 
         */
        const optionBuilder = (option) => {
            option
                .setName(f._long[0] || f._short[0])
                .setDescription(f._desc)
                .setRequired(false);

            if(f._expressive && /**@type {CommandFlagExpressive}*/(f).hasAutocomplete)
                /**@type {import('discord.js').SlashCommandStringOption}*/(option).setAutocomplete(true);

            return option;
        };

        if(f._expressive) {
            return slash[addFunctionName](optionBuilder);
        }

        //@ts-expect-error
        return slash.addBooleanOption(optionBuilder);
    });
}

/**
 * 
 * @param {Client} client 
 * @param {Boolean} log 
 */
function registerCommandFiles(client, log = false) {
    client.ComandosPure ??= new Collection(); //Comandos de Puré
    client.AccionesPure ??= new Collection(); //Comandos de Puré
    client.SlashPure ??= new Collection(); //Comandos Slash de Puré
    client.ContextPure ??= new Collection(); //Comandos Contextuales de Puré
    client.SlashHouraiPure ??= new Collection(); //Comandos Slash de Puré
    client.EmotesPure ??= new Collection(); //Emotes de Puré
    
    const commandFiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
    /**@type {{ name: string, flags: string, tieneEmote: string, tieneMod: string }[]}*/
    const commandTableStack = [];
    
    for(const file of commandFiles) {
        const commandModule = require(`./commands/Pure/${file}`);
        /**@type {CommandManager}*/
        const command = commandModule;
        client.ComandosPure.set(command.name, command);
        
        log && commandTableStack.push({
            name: command.name,
            flags: command.flags.values.join(', '),
            tieneEmote: command.flags.has('EMOTE') ? '✅' : '❌',
            tieneMod: command.flags.has('MOD') ? '✅' : '❌',
        });
    
        if(command.flags.has('EMOTE'))
            client.EmotesPure.set(command.name, command);
    
        if(command.flags.any('PAPA', 'OUTDATED', 'MAINTENANCE', 'GUIDE'))
            continue;
            
        const slash = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.brief || shortenText(command.desc, 100))
            .setDMPermission(false);
        
        if(command.flags.has('MOD'))
            slash.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageMessages);
    
        /**@type {CommandOptions}*/
        const options = command.options;
        if(options)
            setupOptionBuilders(slash, options);
    
        const jsonData = slash.toJSON();
        if(!command.flags.has('HOURAI'))
            client.SlashPure.set(command.name, jsonData);
        else
            client.SlashHouraiPure.set(command.name, jsonData);
    }

    log && console.table(commandTableStack);
    
    const actionFiles = readdirSync('./actions/Instances').filter(file => file.endsWith('.js'));
    /**@type {{ name: String, type: String, tid: String }[]}*/
    const actionTableStack = [];

    for(const file of actionFiles) {
        const actionModule = require(`./actions/Instances/${file}`);
        /**@type {ContextMenuActionManager}*/
        const action = actionModule;
        client.AccionesPure.set(action.name, action);
        
        log && actionTableStack.push({
            name: action.name,
            type: action.type,
        });

        const contextMenu = new ContextMenuCommandBuilder()
            .setName(action.name)
            .setType(action.type)
            .setDMPermission(false);

        for(const [ localeId, localizedName ] of action.localizations)
            contextMenu.setNameLocalization(localeId, localizedName);

        client.ContextPure.set(action.name, contextMenu.toJSON());
    }

    log && console.table(actionTableStack);
}

module.exports = {
    registerCommandFiles,
};