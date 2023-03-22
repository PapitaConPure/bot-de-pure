//#region Carga de módulos necesarios
const { Stats } = require('../localdata/models/stats.js');
const { peopleid } = require('../localdata/config.json');
const { channelIsBlocked } = require('../func.js');
const { auditRequest } = require('../systems/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../localdata/cmdExceptions.js');
const { Translator } = require('../internationalization.js');
const { CommandManager } = require('../commands/Commons/cmdBuilder.js');

/**@param {import('discord.js').Interaction} interaction*/
async function handleBlockedInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({
        content: translator.getText('blockedInteraction', peopleid.papita),
        ephemeral: true,
    });
}

/**@param {import('discord.js').Interaction} interaction*/
async function handleDMInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({ content: translator.getText('dmInteraction') });
}

/**@param {import('discord.js').Interaction} interaction*/
async function handleUnknownInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({
        content: translator.getText('unknownInteraction'),
        ephemeral: true,
    });
}

/**
 * @param {import('discord.js').Interaction} interaction 
 * @param {import('discord.js').Client} client 
 * @param {Stats} stats 
 */
async function handleCommand(interaction, client, stats) {
    const { commandName } = interaction;
    const slash = client.SlashPure.get(commandName) ?? client.SlashHouraiPure.get(commandName);
    if (!slash) return;

    try {
        //Detectar problemas con el comando basado en flags
        /**@type {CommandManager | undefined}*/
        const command = client.ComandosPure.get(commandName);
        const exception = await findFirstException(command.flags, interaction);
        if(exception)
            return interaction.reply({ embeds: [ generateExceptionEmbed(exception, { cmdString: `/${commandName}` }) ], ephemeral: true });
        
        CommandManager.requestize(interaction);
        await command.execute(interaction, interaction.options, true);
        stats.commands.succeeded++;
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `/${commandName}` });
        if(!isPermissionsError)
            stats.commands.failed++;
    }
    stats.markModified('commands');
    return stats.save();
}

/**@param {import('discord.js').Interaction} interaction*/
async function handleHuskInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({
        content: translator.getText('huskInteraction'),
        ephemeral: true,
    });
}

/**
 * 
 * @param {import('discord.js').Interaction} interaction 
 * @param {import('discord.js').Client} client 
 * @param {Stats} stats 
*/
async function handleComponent(interaction, client) {
    if(!interaction.customId)
        return handleUnknownInteraction(interaction);

    try {
        /**@type {Array<String>}*/
        const funcStream = interaction.customId.split('_');
        let commandName = funcStream.shift();
        const func = funcStream.shift();
        console.log(commandName, func, funcStream);
        if(!commandName || !func)
            return handleUnknownInteraction(interaction);

        const command = client.ComandosPure.get(commandName) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(typeof command[func] !== 'function')
            return handleHuskInteraction(interaction);

        return command[func](interaction, ...funcStream);
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `"${interaction.customId}"` });
        if(!isPermissionsError)
            console.error(error);
    }
}

/**
 * 
 * @param {import('discord.js').Interaction} interaction 
 * @param {import('discord.js').Client} client 
 */
async function onInteraction(interaction, client) {
    const { guild, channel } = interaction;
    if(!guild)
        return handleDMInteraction.catch(console.error);
    if(channelIsBlocked(channel))
        return handleBlockedInteraction(interaction).catch(console.error);
    
    auditRequest(interaction);
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });

    //Comando Slash
	if(interaction.isCommand())
        return handleCommand(interaction, client, stats);

    //Funciones de interacción
    if(interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit())
        return handleComponent(interaction, client, stats);

    return handleUnknownInteraction();
}

module.exports = {
    onInteraction,
};