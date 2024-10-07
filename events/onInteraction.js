//#region Carga de módulos necesarios
const { Stats } = require('../localdata/models/stats.js');
const { peopleid } = require('../localdata/config.json');
const { channelIsBlocked, isUsageBanned, decompressId } = require('../func.js');
const { auditRequest } = require('../systems/others/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../localdata/cmdExceptions.js');
const { Translator } = require('../internationalization.js');
const { CommandManager } = require('../commands/Commons/cmdBuilder.js');
const { ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, Client, ContextMenuCommandInteraction, ChatInputCommandInteraction, CommandInteractionOptionResolver, AutocompleteInteraction } = require('discord.js');
const { ContextMenuActionManager } = require('../actions/Commons/actionBuilder.js');
const { CommandOptionSolver, CommandFlagExpressive, CommandParam } = require('../commands/Commons/cmdOpts.js');

/**
 * @param {import('discord.js').Interaction} interaction 
 * @param {Client} client 
 */
async function onInteraction(interaction, client) {
    if(!interaction.inCachedGuild())
        return handleBlockedInteraction(interaction).catch(console.error);

    const { channel, user } = interaction;

    if(channelIsBlocked(channel) || (await isUsageBanned(user)))
        return handleBlockedInteraction(interaction).catch(console.error);
    
    const stats = (await Stats.findOne({})) || new Stats({ since: Date.now() });

    if(interaction.isAutocomplete())
        return handleAutocompleteInteraction(interaction, client, stats);

    auditRequest(interaction);

    if(interaction.isChatInputCommand())
        return handleCommand(interaction, client, stats);

    if(interaction.isContextMenuCommand())
        return handleAction(interaction, client, stats);

    if(interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit())
        return handleComponent(interaction, client, stats);

    return handleUnknownInteraction(interaction);
}

/**
 * @param {ChatInputCommandInteraction<'cached'>} interaction 
 * @param {Client} client 
 * @param {import('../localdata/models/stats.js').StatsDocument} stats 
 */
async function handleCommand(interaction, client, stats) {
    const { commandName } = interaction;
    // @ts-ignore
    const slash = client.SlashPure.get(commandName) ?? client.SlashHouraiPure.get(commandName);
    if(!slash) return;

    try {
        //Detectar problemas con el comando basado en flags
        /**@type {CommandManager}*/
        //@ts-expect-error
        const command = client.ComandosPure.get(commandName);

        if(command.permissions && !command.permissions.isAllowed(interaction.member)) {
            return interaction.channel.send({ embeds: [
                generateExceptionEmbed({
                    tag: undefined,
                    title: 'Permisos insuficientes',
                    desc: 'Este comando requiere permisos para ejecutarse que no tienes actualmente',
                    isException: undefined,
                }, { cmdString: `/${commandName}` })
                .addFields({
                    name: 'Requisitos completos',
                    value: command.permissions.matrix
                        .map((requisite, n) => `${n + 1}. ${requisite.map(p => `\`${p}\``).join(' **o** ')}`)
                        .join('\n')
                })
            ]});
        }

        const exception = await findFirstException(command, interaction);
        if(exception)
            return interaction.reply({ embeds: [ generateExceptionEmbed(exception, { cmdString: `/${commandName}` }) ], ephemeral: true });
        
        const complex = CommandManager.requestize(interaction);
        if(command.experimental) {
            const solver = new CommandOptionSolver(complex, /**@type {CommandInteractionOptionResolver}*/(interaction.options), command.options);
            // @ts-expect-error
            await command.execute(complex, solver);
        } else
            // @ts-expect-error
            await command.execute(complex, interaction.options, true);
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
 * @param {ContextMenuCommandInteraction<'cached'>} interaction 
 * @param {Client} client 
 * @param {import('../localdata/models/stats.js').StatsDocument} stats 
 */
async function handleAction(interaction, client, stats) {
    const { commandName } = interaction;

    //@ts-expect-error
    const action = client.ContextPure.get(commandName);
    if(!action) return;

    try {
        /**@type {ContextMenuActionManager | undefined}*/
        //@ts-expect-error
        const command = client.AccionesPure.get(commandName);
        
        await command.execute(interaction);
        stats.commands.succeeded++;
    } catch(error) {
        //@ts-expect-error
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
 * @param {import('../localdata/models/stats.js').StatsDocument} stats 
*/
async function handleComponent(interaction, client, stats) {
    if(!interaction.customId)
        return handleUnknownInteraction(interaction);

    try {
        /**@type {Array<String>}*/
        const funcStream = interaction.customId.split('_');
        let commandName = funcStream.shift();
        const commandFnName = funcStream.shift();

        console.log(commandName, commandFnName, funcStream);

        if(!commandName || !commandFnName)
            return handleUnknownInteraction(interaction);

        /**@type {CommandManager}*/
        //@ts-expect-error
        const command = client.ComandosPure.get(commandName) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(typeof command[commandFnName] !== 'function')
            return handleHuskInteraction(interaction);

        const commandFn = command[commandFnName];
        
        //Filtros
        const userFilterIndex = commandFn['userFilterIndex'];
        if(userFilterIndex != undefined) {
            if(typeof userFilterIndex !== 'number')
                throw new TypeError(`Se esperaba un valor numérico como índice de parámetro de interacción para filtro de ID de usuario, pero se recibió: ${userFilterIndex} (${typeof userFilterIndex})`);

            const authorId = funcStream[userFilterIndex];
            if(typeof authorId !== 'string')
                throw new RangeError(`Se esperaba una ID de usuario en el parámetro de interacción ${userFilterIndex}. Sin embargo, ninguna ID fue recibida en la posición`);
            
            if(interaction.user.id !== decompressId(authorId)) {
                const translator = await Translator.from(interaction.user.id);
                return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
            }
        }

        return commandFn(interaction, ...funcStream);
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `"${interaction.customId}"` });
        if(!isPermissionsError)
            console.error(error);
    }
}

/**
 * @param {AutocompleteInteraction<'cached'>} interaction 
 * @param {Client} client 
 * @param {import('../localdata/models/stats.js').StatsDocument} stats 
*/
async function handleAutocompleteInteraction(interaction, client, stats) {
    const { commandName, options } = interaction;
    const focusedOption = options.getFocused(true);

    if(!focusedOption) return;

    const optionName = focusedOption.name;
    const optionValue = focusedOption.value;

    console.log([ commandName, optionName, '«?»', optionValue ]);

    try {
        /**@type {CommandManager}*/
        //@ts-expect-error
        const command = /***/client.ComandosPure.get(commandName) || client.ComandosPure.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        const option = /**@type {CommandParam | CommandFlagExpressive}*/(command.options.options.get(optionName));

        if(!option)
            return interaction.respond([{
                name: 'Ocurrió un error. Disculpa las molestias',
                value: 'error',
            }]);
        
        return option.autocomplete(interaction, optionValue);
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `"${optionName}"` });
        if(!isPermissionsError)
            console.error(error);
    }
}


//#region Casos extremos
/**@param {import('discord.js').Interaction} interaction*/
async function handleDMInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);

    if(interaction.isAutocomplete()) {
        return interaction.respond([
            {
                name: 'Esta característica no está disponible',
                value: -1
            }
        ]);
    } else {
        return interaction.reply({ content: translator.getText('dmInteraction') });
    }
}

/**@param {import('discord.js').Interaction} interaction*/
async function handleBlockedInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    if(interaction.isRepliable()) {
        return interaction.reply({
            content: translator.getText('blockedInteraction', peopleid.papita),
            ephemeral: true,
        });
    } else {
        interaction.respond([]);
    }
}

/**@param {import('discord.js').Interaction} interaction*/
async function handleUnknownInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    if(interaction.isRepliable()) {
        return interaction.reply({
            content: translator.getText('unknownInteraction'),
            ephemeral: true,
        });
    } else {
        interaction.respond([]);
    }
}

/**@param {import('discord.js').Interaction} interaction*/
async function handleHuskInteraction(interaction) {
    const translator = await Translator.from(interaction.user.id);
    if(interaction.isRepliable()) {
        return interaction.reply({
            content: translator.getText('huskInteraction'),
            ephemeral: true,
        });
    } else {
        interaction.respond([]);
    }
}
//#endregion

module.exports = {
    onInteraction,
};