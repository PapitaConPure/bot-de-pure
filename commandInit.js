const { Collection, PermissionFlagsBits, SlashCommandBuilder, Client, ContextMenuCommandBuilder } = require('discord.js');
const { CommandManager, CommandOptionsManager } = require('./commands/Commons/commands.js');
const { shortenText } = require('./func.js');
const { readdirSync } = require('fs');
const { ContextMenuActionManager } = require('./actions/Commons/actionBuilder.js');

/**
 * @param {import('discord.js').SlashCommandBuilder} slash
 * @param {CommandOptionsManager} options
 */
function setupOptionBuilders(slash, options) {
    /**@type {Map<import('./commands/Commons/cmdOpts.js').ParamType, String>} type*/
    const addFunctionNames = new Map()
    addFunctionNames.set('NUMBER',  'addNumberOption')
                    .set('USER',    'addUserOption')
                    .set('MEMBER',  'addUserOption')
                    .set('ROLE',    'addRoleOption')
                    .set('CHANNEL', 'addChannelOption')
                    .set('ID',      'addIntegerOption');
    const defaultAddFunctionName =  'addStringOption';

    options.params.forEach(p => {
        const addFunctionName = addFunctionNames.get(p._type) ?? defaultAddFunctionName;
        const optionBuilder = (opt, name, fullyOptional = false) => opt.setName(name).setDescription(p._desc).setRequired(!(fullyOptional || p._optional));
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
        const addFunctionName = addFunctionNames.get(f._type) ?? defaultAddFunctionName;
        const optionBuilder = (opt) => opt.setName(f._long[0] || f._short[0]).setDescription(f._desc).setRequired(false);
        if(f._expressive)
            return slash[addFunctionName](optionBuilder);
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
    
        /**@type {CommandOptionsManager}*/
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