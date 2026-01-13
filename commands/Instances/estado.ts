import { EmbedBuilder, StringSelectMenuBuilder, MessageFlags, ContainerBuilder, ButtonStyle, ButtonBuilder, SeparatorSpacingSize } from 'discord.js';
import { version, note, changelog, todo as toDo } from '../../data/botStatus.json';
import { noDataBase, remoteStartup, tenshiColor } from '../../data/globalProps';
import { p_pure } from '../../utils/prefixes';
import { Stats } from '../../models/stats';
import { quantityDisplay } from '../../func';
import { CommandTags, Command, commandFilenames } from '../Commons';
import { searchCommand, makeGuideRow, getWikiPageComponentsV2 } from '../../systems/others/wiki';
import { Translator } from '../../i18n';

const COMMAND_REGEX = new RegExp(`(${p_pure().raw})([a-záéíóúñ0-9_.-]+)`, 'gi');

function listFormat(str: string, request: import('../Commons/typings').AnyRequest) {
    return str.replace(COMMAND_REGEX, `\`${p_pure(request.guildId).raw}$2\``);
};

const flags = new CommandTags().add('COMMON');
const command = new Command('estado', flags)
    .setAliases('status', 'botstatus')
    .setLongDescription('Muestra mi estado actual. Eso incluye versión, host, registro de cambios, cosas por hacer, etc')
    .setExecution(async request => {
        const translator = await Translator.from(request.member);
        const stats = (!noDataBase && await Stats.findOne({})) || new Stats({ since: Date.now( )});
        const counts = {
            commands: commandFilenames.length,
            guilds: request.client.guilds.cache.size
        }
        const totalCommands = stats.commands.succeeded + stats.commands.failed;
        const me = request.client.user;

        const container = new ContainerBuilder()
            .setAccentColor(tenshiColor)
            .addMediaGalleryComponents(mediaGallery =>
                mediaGallery.addItems(MediaGalleryItem =>
                    MediaGalleryItem.setURL('https://i.imgur.com/lQOPok9.jpeg')
                )
            )
            .addSectionComponents(section =>
                section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(translator.getText('estadoVersion', version.number)),
                        textDisplay => textDisplay.setContent(translator.getText('estadoTitle', me.displayName)),
                        textDisplay => textDisplay.setContent(translator.getText('estadoCommandsAndServersCount', counts.commands, counts.guilds)),
                    )
                    .setThumbnailAccessory(accessory =>
                        accessory
                            .setDescription(translator.getText('estadoAvatarAlt', me.displayName))
                            .setURL(me.avatarURL({ extension: 'png', size: 1024 }))
                    )
            )
            .addSeparatorComponents(separator => separator.setDivider(true))
            .addTextDisplayComponents(textDisplay =>
                textDisplay.setContent(`## ${note[translator.locale]}`)
            )
            .addActionRowComponents(actionRow =>
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('estado_showChanges')
                        .setEmoji(remoteStartup ? '1356977730754842684' : '👁️')
                        .setLabel(translator.getText('estadoDevelopmentChangesButton'))
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('estado_showUpcoming')
                        .setEmoji(remoteStartup ? '1356977730754842684' : '👁️')
                        .setLabel(translator.getText('estadoDevelopmentUpcomingButton'))
                        .setStyle(ButtonStyle.Secondary),
                )
            )
            .addSeparatorComponents(separator => separator.setDivider(false))
            .addTextDisplayComponents(textDisplay =>
                textDisplay.setContent([
                    translator.getText('estadoStatsTitle'),
                    translator.getText('estadoStatsRegisteredMessagesCount', quantityDisplay(stats.read, translator)),
                    translator.getText('estadoStatsProcessedCommandsCount', quantityDisplay(totalCommands, translator)),
                    translator.getText('estadoStatsSuccessfulCommandsCount', quantityDisplay(stats.commands.succeeded, translator), (stats.commands.succeeded / totalCommands * 100).toFixed(2)),
                    translator.getText('estadoStatsFailedCommandsCount', quantityDisplay(stats.commands.failed, translator), (stats.commands.failed / totalCommands * 100).toFixed(2)),
                ].join('\n'))
            );

        return request.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container],
        });
    })
    .setSelectMenuResponse(async function getHelp(interaction) {
		const guildPrefix = p_pure(interaction.guildId).raw;
		const helpCommand = `${guildPrefix}${command.name}`;
        const query = interaction.values[0];
        const foundCommand = searchCommand(interaction, query);

		if(!foundCommand) {
			const embed = new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
				});
			const components = [makeGuideRow(interaction)];
			return interaction.update({ embeds: [embed], components });
		}

        const components = getWikiPageComponentsV2(foundCommand, Command.requestize(interaction));
        return interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: components,
        });
    })
    .setButtonResponse(async function showChanges(interaction) {
        const translator = await Translator.from(interaction);

        const matchedCommands = changelog.join().matchAll(COMMAND_REGEX);
        const formattedChangelog = changelog.map(item => `- ${item}`).join('\n');
        const container = new ContainerBuilder()
            .setAccentColor(tenshiColor)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent([
                    translator.getText('estadoChangesTitle'),
                    listFormat(formattedChangelog, interaction),
                ].join('\n')),
            );
        
        if(matchedCommands != null) {
            const prefix = p_pure(interaction.guildId).raw;
            const commandOptions = /**@type {(import('discord.js').SelectMenuComponentOptionData|import('discord.js').APISelectMenuOption)[]}*/([]);
            for(const matchedCommand of matchedCommands) {
                const commandName = matchedCommand[2];
                commandOptions.push({
                    label: `${prefix}${commandName}`,
                    value: commandName,
                });
            }

            container.addActionRowComponents(actionRow =>
                actionRow.addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('estado_getHelp')
                        .setPlaceholder('Comandos mencionados...')
                        .addOptions(commandOptions),
                )
            );
        }

        return interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container],
        });
    })
    .setButtonResponse(async function showUpcoming(interaction) {
        const translator = await Translator.from(interaction);
        
        const formattedToDo = toDo.map(item => `- ${item}`).join('\n');
        const container = new ContainerBuilder()
            .setAccentColor(tenshiColor)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent([
                    translator.getText('estadoUpcomingTitle'),
                    listFormat(formattedToDo, interaction),
                ].join('\n')),
            );

        return interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container],
        });
    });

export default command;
