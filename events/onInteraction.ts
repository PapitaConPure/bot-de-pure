import { puré } from '../core/commandInit';
import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, ContextMenuCommandInteraction, Interaction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { Stats } from '../models/stats';
import userIds from '../data/userIds.json';
import { channelIsBlocked, isUsageBanned, decompressId } from '../func';
import { auditRequest } from '../systems/others/auditor';
import { findFirstException, handleAndAuditError, generateExceptionEmbed } from '../utils/cmdExceptions';
import { Translator } from '../i18n';
import { Command } from '../commands/Commons/cmdBuilder';
import { CommandFlagExpressive, CommandOptionSolver, CommandParam } from '../commands/Commons/cmdOpts';
import { noDataBase } from '../data/globalProps';

export async function onInteraction(interaction: Interaction) {
    if(!interaction.inCachedGuild())
        return handleBlockedInteraction(interaction).catch(console.error);

    const { channel, user } = interaction;

    if(channelIsBlocked(channel) || (await isUsageBanned(user)))
        return handleBlockedInteraction(interaction).catch(console.error);
    
    const stats = (!noDataBase && await Stats.findOne({})) || new Stats({ since: Date.now() });

    if(interaction.isAutocomplete())
        return handleAutocompleteInteraction(interaction);

    auditRequest(interaction);

    if(interaction.isChatInputCommand())
        return handleCommand(interaction, stats);

    if(interaction.isContextMenuCommand())
        return handleAction(interaction, stats);

    if(interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit())
        return handleComponent(interaction);

    return handleUnknownInteraction(interaction);
}

async function handleCommand(interaction: ChatInputCommandInteraction<'cached'>, stats: import('../models/stats.js').StatsDocument) {
    const { commandName } = interaction;
    const slash = puré.slash.get(commandName) ?? puré.slashSaki.get(commandName);
    if(!slash) return;

    try {
        //Detectar problemas con el comando basado en flags
        const command: Command = puré.commands.get(commandName);

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

        const complex = Command.requestize(interaction);
        if(command.isLegacy()) {
            await command.execute(complex, interaction.options, true, null);
        } else if(command.isNotLegacy()) {
            const solver = new CommandOptionSolver(complex, interaction.options, command.options);
            await command.execute(complex, solver);
        }
        stats.commands.succeeded++;
    } catch(error) {
        const isPermissionsError = handleAndAuditError(error, interaction, { details: `/${commandName}` });
        if(!isPermissionsError)
            stats.commands.failed++;
    }

    if(noDataBase) return;
    
    stats.markModified('commands');
    return stats.save();
}

async function handleAction(interaction: ContextMenuCommandInteraction<'cached'>, stats: import('../models/stats.js').StatsDocument) {
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

    if(noDataBase) return;

    stats.markModified('commands');
    return stats.save();
}

async function handleComponent(interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction) {
    if(!interaction.customId)
        return handleUnknownInteraction(interaction);

    try {
        const funcStream: string[] = interaction.customId.split('_');
        let commandName = funcStream.shift();
        const commandFnName = funcStream.shift();

        console.log(commandName, commandFnName, funcStream);

        if(!commandName || !commandFnName)
            return handleUnknownInteraction(interaction);

        const command: Command = puré.commands.get(commandName) || puré.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
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

async function handleAutocompleteInteraction(interaction: AutocompleteInteraction<'cached'>) {
    const { commandName, options } = interaction;
    const focusedOption = options.getFocused(true);

    if(!focusedOption) return;

    const optionName = focusedOption.name;
    const optionValue = focusedOption.value;

    console.log([ commandName, optionName, '«?»', optionValue ]);

    try {
        const command: Command = puré.commands.get(commandName) || puré.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        const option = (
            command.options.options.get(optionName)
            ?? command.options.options.get(`${optionName.slice(0, optionName.lastIndexOf('_'))}s`)
            ?? command.options.options.get(`${optionName.slice(0, optionName.lastIndexOf('_'))}`)
        ) as (CommandParam | CommandFlagExpressive);

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

async function handleBlockedInteraction(interaction: Interaction) {
    const translator = await Translator.from(interaction.user.id);
    if(interaction.isRepliable()) {
        return interaction.reply({
            content: translator.getText('blockedInteraction', userIds.papita),
            ephemeral: true,
        });
    } else {
        interaction.respond([]);
    }
}

async function handleUnknownInteraction(interaction: Interaction) {
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

async function handleHuskInteraction(interaction: Interaction) {
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
