//#region Carga de módulos necesarios
const { puré } = require('../commandInit.js');
const { Stats } = require('../localdata/models/stats.js');
const globalConfigs = require('../localdata/config.json');
const { peopleid } = globalConfigs;
const { channelIsBlocked, isUsageBanned, decompressId } = require('../func.js');
const { auditRequest } = require('../systems/others/auditor.js');
const { findFirstException, handleAndAuditError, generateExceptionEmbed } = require('../localdata/cmdExceptions.js');
const { Translator } = require('../internationalization.js');
const { CommandManager } = require('../commands/Commons/cmdBuilder.js');
const { CommandOptionSolver } = require('../commands/Commons/cmdOpts.js');
//#endregion

/**
 * @param {import('discord.js').Interaction} interaction 
 * @param {import('discord.js').Client} client 
 */
async function onInteraction(interaction, client) {
    if(!interaction.inCachedGuild())
        return handleBlockedInteraction(interaction).catch(console.error);

    const { channel, user } = interaction;

    if(channelIsBlocked(channel) || (await isUsageBanned(user)))
        return handleBlockedInteraction(interaction).catch(console.error);
    
    const stats = (!globalConfigs.noDataBase && await Stats.findOne({})) || new Stats({ since: Date.now() });

    if(interaction.isAutocomplete())
        return handleAutocompleteInteraction(interaction);

    auditRequest(interaction);

    if(interaction.isChatInputCommand())
        return handleCommand(interaction, client, stats);

    if(interaction.isContextMenuCommand())
        return handleAction(interaction, client, stats);

    if(interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit())
        return handleComponent(interaction);

    return handleUnknownInteraction(interaction);
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction 
 * @param {import('discord.js').Client} client 
 * @param {import('../localdata/models/stats.js').StatsDocument} stats 
 */
async function handleCommand(interaction, client, stats) {
    const { commandName } = interaction;
    const slash = puré.slash.get(commandName) ?? puré.slashHourai.get(commandName);
    if(!slash) return;

    try {
        //Detectar problemas con el comando basado en flags
        /**@type {CommandManager}*/
        const command = puré.commands.get(commandName);

        if(command.permissions) {
            if(!command.permissions.isAllowedIn(interaction.member, interaction.channel)) {
                const translator = await Translator.from(interaction.member);
                return interaction.channel.send({ embeds: [
                    generateExceptionEmbed({
                        title: translator.getText('missingMemberChannelPermissionsTitle'),
                        desc: translator.getText('missingMemberChannelPermissionsDescription'),
                    }, { cmdString: `/${commandName}` })
                    .addFields({
                        name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
                        value: command.permissions.matrix
                            .map((requisite, n) => `${n + 1}. ${requisite.map(p => `\`${p}\``).join(' **o** ')}`)
                            .join('\n'),
                    }),
                ]});
            }
            
            if(!command.permissions.amAllowedIn(interaction.channel)) {
                const translator = await Translator.from(interaction.member);
                return interaction.channel.send({ embeds: [
                    generateExceptionEmbed({
                        title: translator.getText('missingMemberChannelPermissionsTitle'),
                        desc: translator.getText('missingClientChannelPermissionsDescription'),
                    }, { cmdString: `/${commandName}` })
                    .addFields({
                        name: translator.getText('missingMemberChannelPermissionsFullRequisitesName'),
                        value: command.permissions.matrix
                            .map((requisite, n) => `${n + 1}. ${requisite.map(p => `\`${p}\``).join(' **o** ')}`)
                            .join('\n'),
                    }),
                ]});
            }
        }

        const exception = await findFirstException(command, interaction);
        if(exception)
            return interaction.reply({ embeds: [ generateExceptionEmbed(exception, { cmdString: `/${commandName}` }) ], ephemeral: true });

        const complex = CommandManager.requestize(interaction);
        if(!command.legacy) {
            const solver = new CommandOptionSolver(complex, /**@type {import('discord.js').CommandInteractionOptionResolver}*/(interaction.options), command.options);
            await command.execute(complex, solver);
        } else {
            // @ts-expect-error
            await command.execute(complex, interaction.options, true);
        }
        stats.commands.succeeded++;
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `/${commandName}` });
        if(!isPermissionsError)
            stats.commands.failed++;
    }

    if(globalConfigs.noDataBase) return;
    
    stats.markModified('commands');
    return stats.save();
}

/**
 * @param {import('discord.js').ContextMenuCommandInteraction<'cached'>} interaction 
 * @param {import('discord.js').Client} client 
 * @param {import('../localdata/models/stats.js').StatsDocument} stats 
 */
async function handleAction(interaction, client, stats) {
    const { commandName } = interaction;

    const contextMenu = puré.contextMenu.get(commandName);
    if(!contextMenu) return;

    try {
        const action = puré.actions.get(commandName);
        
        await action.execute(interaction);
        stats.commands.succeeded++;
    } catch(error) {
        //@ts-expect-error
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `/${commandName}` });
        if(!isPermissionsError)
            stats.commands.failed++;
    }

    if(globalConfigs.noDataBase) return;

    stats.markModified('commands');
    return stats.save();
}

/**
 * 
 * @param {import('discord.js').ButtonInteraction | import('discord.js').StringSelectMenuInteraction | import('discord.js').ModalSubmitInteraction} interaction 
*/
async function handleComponent(interaction) {
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
        const command = puré.commands.get(commandName) || puré.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(!command)
            throw new ReferenceError(`El comando ${commandName} no existe`);
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
 * @param {import('discord.js').AutocompleteInteraction<'cached'>} interaction 
*/
async function handleAutocompleteInteraction(interaction) {
    const { commandName, options } = interaction;
    const focusedOption = options.getFocused(true);

    if(!focusedOption) return;

    const optionName = focusedOption.name;
    const optionValue = focusedOption.value;

    console.log([ commandName, optionName, '«?»', optionValue ]);

    try {
        /**@type {CommandManager}*/
        const command = puré.commands.get(commandName) || puré.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        const option = /**@type {import('../commands/Commons/cmdOpts.js').CommandParam | import('../commands/Commons/cmdOpts.js').CommandFlagExpressive}*/(
            command.options.options.get(optionName)
            ?? command.options.options.get(`${optionName.slice(0, optionName.lastIndexOf('_'))}s`)
            ?? command.options.options.get(`${optionName.slice(0, optionName.lastIndexOf('_'))}`)
        );

        if(!option)
            return interaction.respond([{
                name: 'Ocurrió un error. Disculpa las molestias',
                value: 'BDP_ERR_NOOPTION',
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