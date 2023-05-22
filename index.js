const Discord = require('discord.js');
const globalConfigs = require('./localdata/config.json');
const { CommandManager, CommandOptionsManager } = require('./commands/Commons/commands.js');
const { shortenText } = require('./func.js');
const fs = require('fs');

const { onStartup, discordToken, booruApiKey, booruUserId } = require('./events/onStartup.js');
const { onMessage } = require('./events/onMessage.js');
const { onInteraction } = require('./events/onInteraction.js');
const { onVoiceUpdate } = require('./events/onVoiceUpdate.js');
const { onRateLimit } = require('./events/onRateLimit.js');
const { onGuildMemberAdd } = require('./events/onGuildMemberAdd.js');
const { onGuildMemberRemove } = require('./events/onGuildMemberRemove.js');
const { onGuildMemberUpdate } = require('./events/onGuildMemberUpdate.js');

console.time('Establecimiento de parámetros iniciales');
const { IntentsBitField, PermissionFlagsBits, Partials } = Discord;
const { Flags: intentBits } = IntentsBitField;

const botIntents = new IntentsBitField().add(
    intentBits.Guilds,
    intentBits.GuildMembers,
    intentBits.GuildEmojisAndStickers,
    intentBits.GuildIntegrations,
    intentBits.GuildPresences,
    intentBits.GuildMessages,
    intentBits.GuildMessageReactions,
    intentBits.GuildMessageTyping,
    intentBits.GuildVoiceStates,
    intentBits.DirectMessages,
    intentBits.MessageContent,
);
const botPartials = [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
];
const client = new Discord.Client({
    intents: botIntents,
    partials: botPartials,
    fetchAllMembers: true,
    allowedMentions: {
        parse: [ 'users', 'roles' ],
        repliedUser: false,
    },
});
globalConfigs.p_pure['0'] = { raw: 'p!', regex: /^[Pp] *![\n ]*/ };
globalConfigs.booruCredentials.apiKey = booruApiKey;
globalConfigs.booruCredentials.userId = booruUserId;
console.timeEnd('Establecimiento de parámetros iniciales');

const logOptions = {
    commands: false,
};

//#region Detección de archivos de comandos
console.time('Detección de archivos de comando');
client.ComandosPure = new Discord.Collection(); //Comandos de Puré
client.SlashPure = new Discord.Collection(); //Comandos Slash de Puré
client.SlashHouraiPure = new Discord.Collection(); //Comandos Slash de Puré
client.EmotesPure = new Discord.Collection(); //Emotes de Puré

/**
 * @param {Discord.SlashCommandBuilder} options
 * @param {CommandOptionsManager} options
 */
function setupOptionBuilders(slash, options) {
    /**@type {Map<import('./commands/Commons/cmdOpts').ParamType, String>} type*/
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

const commandFiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
const commandTableStack = [];
for(const file of commandFiles) {
    const commandModule = require(`./commands/Pure/${file}`);
    /**@type {CommandManager}*/
    const command = commandModule;
    client.ComandosPure.set(command.name, command);
    
    logOptions.commands && commandTableStack.push({
        name: command.name,
        flags: command.flags.values.join(', '),
        tieneEmote: command.flags.has('EMOTE') ? '✅' : '❌',
        tieneMod: command.flags.has('MOD') ? '✅' : '❌',
    });

    if(command.flags.has('EMOTE'))
        client.EmotesPure.set(command.name, command);

    if(command.flags.any('PAPA', 'OUTDATED', 'MAINTENANCE', 'GUIDE'))
        continue;
        
    const slash = new Discord.SlashCommandBuilder()
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
logOptions.commands && console.table(commandTableStack);
console.timeEnd('Detección de archivos de comando');
//#endregion

console.time('Registro de eventos del cliente');
client.on('ready', onStartup);

client.on('messageCreate', message => onMessage(message, client));

client.on('interactionCreate', interaction => onInteraction(interaction, client));

client.on('voiceStateUpdate', onVoiceUpdate);

client.on('guildMemberAdd', onGuildMemberAdd);

client.on('guildMemberRemove', onGuildMemberRemove);

client.on('guildMemberUpdate', onGuildMemberUpdate);

client.rest.on('rateLimited', onRateLimit);

client.login(discordToken);
console.timeEnd('Registro de eventos del cliente');