//#region Carga de módulos necesarios
const { Stats } = require('../localdata/models/stats.js');
const { peopleid } = require('../localdata/config.json');
const { channelIsBlocked, isUsageBanned } = require('../func.js');
const { auditRequest } = require('../systems/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../localdata/cmdExceptions.js');
const { Translator } = require('../internationalization.js');
const { CommandManager } = require('../commands/Commons/cmdBuilder.js');
const { Interaction, CommandInteraction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, Client, ContextMenuCommandInteraction } = require('discord.js');
const { ContextMenuActionManager } = require('../actions/Commons/actionBuilder.js');

/**
 * 
 * @param {Interaction} interaction 
 * @param {Client} client 
 */
async function onInteraction(interaction, client) {
    const { guild, channel, user } = interaction;

    if(!guild)
        return handleDMInteraction.catch(console.error);

    if(channelIsBlocked(channel) || (await isUsageBanned(user)))
        return handleBlockedInteraction(interaction).catch(console.error);
    
    if(!interaction.customId?.startsWith('confesión'))
        auditRequest(interaction);
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });

    //Acción
    if(interaction.isContextMenuCommand())
        return handleAction(interaction, client, stats);

    //Comando Slash
	if(interaction.isCommand())
        return handleCommand(interaction, client, stats);

    //Funciones de interacción
    if(interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit())
        return handleComponent(interaction, client, stats);

    return handleUnknownInteraction();
}

/**
 * @param {CommandInteraction} interaction 
 * @param {Client} client 
 * @param {Stats} stats 
 */
async function handleCommand(interaction, client, stats) {
    const { commandName } = interaction;
    const slash = client.SlashPure.get(commandName) ?? client.SlashHouraiPure.get(commandName);
    if(!slash) return;

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

/**
 * @param {ContextMenuCommandInteraction} interaction 
 * @param {Client} client 
 * @param {Stats} stats 
 */
async function handleAction(interaction, client, stats) {
    const { commandName } = interaction;

    const action = client.ContextPure.get(commandName);
    if(!action) return;

    try {
        /**@type {ContextMenuActionManager | undefined}*/
        const command = client.AccionesPure.get(commandName);
        
        await command.execute(interaction);
        stats.commands.succeeded++;
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `/${commandName}` });
        if(!isPermissionsError)
            stats.commands.failed++;
    }

    stats.markModified('commands');
    return stats.save();
}

/**
 * 
 * @param {ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction} interaction 
 * @param {Client} client 
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

//#region Casos extremos
/**@param {Interaction} interaction*/
async function handleDMInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({ content: translator.getText('dmInteraction') });
}

/**@param {Interaction} interaction*/
async function handleBlockedInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({
        content: translator.getText('blockedInteraction', peopleid.papita),
        ephemeral: true,
    });
}

/**@param {Interaction} interaction*/
async function handleUnknownInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({
        content: translator.getText('unknownInteraction'),
        ephemeral: true,
    });
}

/**@param {Interaction} interaction*/
async function handleHuskInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    return interaction.reply({
        content: translator.getText('huskInteraction'),
        ephemeral: true,
    });
}
//#endregion

module.exports = {
    onInteraction,
};