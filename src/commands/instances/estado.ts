import {
	type APISelectMenuOption,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	EmbedBuilder,
	MessageFlags,
	type SelectMenuComponentOptionData,
	StringSelectMenuBuilder,
} from 'discord.js';
import type { AnyRequest } from 'types/commands';
import { changelog, note, todo as toDo, version } from '@/data/botStatus.json';
import { tenshiColor } from '@/data/globalProps';
import { Translator } from '@/i18n';
import { StatsModel } from '@/models/stats';
import { getWikiPageComponentsV2, makeGuideRow, searchCommand } from '@/systems/others/wiki';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { quantityDisplay } from '@/utils/misc';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandTags, commandFilenames } from '../commons';

const COMMAND_REGEX = new RegExp(`(${p_pure().raw})([a-záéíóúñ0-9_.-]+)`, 'gi');

function listFormat(str: string, request: AnyRequest) {
	return str.replace(COMMAND_REGEX, `\`${p_pure(request.guildId).raw}$2\``);
}

const flags = new CommandTags().add('COMMON');
const command = new Command(
	{
		es: 'estado',
		en: 'status',
		ja: 'status',
	},
	flags,
)
	.setAliases('status', 'botstatus')
	.setLongDescription(
		'Muestra mi estado actual. Eso incluye versión, registro de cambios, cosas por hacer, etc',
	)
	.setExecution(async (request) => {
		const translator = await Translator.from(request.member);
		const stats = (await StatsModel.findOne({})) || new StatsModel({ since: Date.now() });
		const counts = {
			commands: commandFilenames.length,
			guilds: request.client.guilds.cache.size,
		};
		const totalCommands = stats.commands.succeeded + stats.commands.failed;
		const me = request.client.user;

		const container = new ContainerBuilder()
			.setAccentColor(tenshiColor)
			.addMediaGalleryComponents((mediaGallery) =>
				mediaGallery.addItems((MediaGalleryItem) =>
					MediaGalleryItem.setURL('https://i.imgur.com/lQOPok9.jpeg'),
				),
			)
			.addSectionComponents((section) =>
				section
					.addTextDisplayComponents(
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText('estadoVersion', version.number),
							),
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText('estadoTitle', me.displayName),
							),
						(textDisplay) =>
							textDisplay.setContent(
								translator.getText(
									'estadoCommandsAndServersCount',
									counts.commands,
									counts.guilds,
								),
							),
					)
					.setThumbnailAccessory((accessory) =>
						accessory
							.setDescription(translator.getText('estadoAvatarAlt', me.displayName))
							.setURL(me.displayAvatarURL({ extension: 'png', size: 1024 })),
					),
			)
			.addSeparatorComponents((separator) => separator.setDivider(true))
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`## ${note[translator.locale]}`),
			)
			.addActionRowComponents((actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId('estado_showChanges')
						.setEmoji(getBotEmojiResolvable('eyeAccent'))
						.setLabel(translator.getText('estadoDevelopmentChangesButton'))
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId('estado_showUpcoming')
						.setEmoji(getBotEmojiResolvable('eyeAccent'))
						.setLabel(translator.getText('estadoDevelopmentUpcomingButton'))
						.setStyle(ButtonStyle.Secondary),
				),
			)
			.addSeparatorComponents((separator) => separator.setDivider(false))
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					[
						translator.getText('estadoStatsTitle'),
						translator.getText(
							'estadoStatsRegisteredMessagesCount',
							quantityDisplay(stats.read, translator),
						),
						translator.getText(
							'estadoStatsProcessedCommandsCount',
							quantityDisplay(totalCommands, translator),
						),
						translator.getText(
							'estadoStatsSuccessfulCommandsCount',
							quantityDisplay(stats.commands.succeeded, translator),
							((stats.commands.succeeded / totalCommands) * 100).toFixed(2),
						),
						translator.getText(
							'estadoStatsFailedCommandsCount',
							quantityDisplay(stats.commands.failed, translator),
							((stats.commands.failed / totalCommands) * 100).toFixed(2),
						),
					].join('\n'),
				),
			);

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components: [container],
		});
	})
	.setSelectMenuResponse(async function getHelp(interaction) {
		const translator = await Translator.from(interaction);

		const guildPrefix = p_pure(interaction).raw;
		const helpCommand = `${guildPrefix}${command.localizedNames[translator.locale]}`;
		const query = interaction.values[0];
		const foundCommand = await searchCommand(interaction, query, translator);

		if (!foundCommand) {
			const embed = new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
				});
			const components = [makeGuideRow(interaction, translator)];
			return interaction.update({ embeds: [embed], components });
		}

		const components = getWikiPageComponentsV2(
			foundCommand,
			Command.requestize(interaction),
			translator,
		);
		return interaction.reply({
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: components,
		});
	})
	.setButtonResponse(async function showChanges(interaction) {
		const translator = await Translator.from(interaction);

		const matchedCommands = changelog.join().matchAll(COMMAND_REGEX);
		const formattedChangelog = changelog.map((item) => `- ${item}`).join('\n');
		const container = new ContainerBuilder()
			.setAccentColor(tenshiColor)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					[
						translator.getText('estadoChangesTitle'),
						listFormat(formattedChangelog, interaction),
					].join('\n'),
				),
			);

		if (matchedCommands != null) {
			const prefix = p_pure(interaction.guildId).raw;
			const commandOptions: (SelectMenuComponentOptionData | APISelectMenuOption)[] = [];
			for (const matchedCommand of matchedCommands) {
				const commandName = matchedCommand[2];
				commandOptions.push({
					label: `${prefix}${commandName}`,
					value: commandName,
				});
			}

			container.addActionRowComponents((actionRow) =>
				actionRow.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('estado_getHelp')
						.setPlaceholder('Comandos mencionados...')
						.addOptions(commandOptions),
				),
			);
		}

		return interaction.reply({
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: [container],
		});
	})
	.setButtonResponse(async function showUpcoming(interaction) {
		const translator = await Translator.from(interaction);

		const formattedToDo = toDo.map((item) => `- ${item}`).join('\n');
		const container = new ContainerBuilder()
			.setAccentColor(tenshiColor)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					[
						translator.getText('estadoUpcomingTitle'),
						listFormat(formattedToDo, interaction),
					].join('\n'),
				),
			);

		return interaction.reply({
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			components: [container],
		});
	});

export default command;
