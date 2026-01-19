import { Command, CommandPermissions, CommandTags } from '../Commons/';
import { ContainerBuilder, Guild, MessageFlags, SeparatorSpacingSize, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { tenshiColor } from '../../data/globalProps';
import { Locales, Translator } from '../../i18n';
import { compressId } from '../../func';

const tags = new CommandTags().add('MOD', 'MAINTENANCE');

const permissions = new CommandPermissions()
	.requireAnyOf([ 'ManageGuild' ]);

const command = new Command('servidor', tags)
	.setAliases('server', 'guild', 'sv')
	.setBriefDescription('Para ver y configurar las preferencias del servidor por medio de un Asistente')
	.setLongDescription(
		'Para ver y configurar las preferencias del servidor.',
		'Si quieres cambiar alguna configuración, puedes presionar cualquier botón para proceder con el Asistente',
	)
	.setPermissions(permissions)
	.setExecution(async (request) => {
		const translator = await Translator.from(request);
		const compressedUserId = compressId(request.userId);
		console.log('wa');
		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components: [ makeDashboardContainer(compressedUserId, request.guild, translator) ],
		});
	});

function makeDashboardContainer(compressedUserId: string, guild: Guild, translator: Translator) {
	const container = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addSectionComponents(section =>
			section
				.addTextDisplayComponents(
					textDisplay => textDisplay.setContent(
						translator.getText('serverDashboardServerEpigraph')
					),
					textDisplay => textDisplay.setContent(`## ${guild.name}`),
				)
				.setThumbnailAccessory(thumbnail =>
					thumbnail
						.setDescription(translator.getText('infoGuildIconAlt'))
						.setURL(guild.iconURL({ size: 512 }))
				)
		)
		.addSeparatorComponents(separator => separator.setDivider(true))
		.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('serverDashboardLanguageName'))
		)
		.addActionRowComponents(actionRow =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`server_selectLanguage_${compressedUserId}`)
					.setPlaceholder(translator.getText('languageMenuPlaceholder'))
					.setOptions(Object.values(Locales).map(locale => {
						const subTranslator = new Translator(locale);
						return new StringSelectMenuOptionBuilder()
							.setLabel(subTranslator.getText('currentLanguage'))
							.setEmoji(subTranslator.getText('currentLanguageEmojiId'))
							.setValue(locale)
							.setDefault(translator.locale === subTranslator.locale);
					})),
			)
		)
		.addSeparatorComponents(separator => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
		.addActionRowComponents(actionRow =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`server_selectConfig_${compressedUserId}`)
					.setPlaceholder(translator.getText('serverDashboardMenuConfig'))
					.setOptions([
						{
							label: 'PuréFeed',
							description: translator.getText('yoDashboardMenuConfigFeedDesc'),
							emoji: '1460145550119669912',
							value: 'feed',
						},
						{
							label: 'PuréVoice',
							description: translator.getText('yoDashboardMenuConfigVoiceDesc'),
							emoji: '1460145551847723132',
							value: 'voice',
						},
						{
							label: translator.getText('serverDashboardMenuConfigConfessionsLabel'),
							emoji: '1461426802890244116',
							value: 'confessions',
						},
					]),
			)
		);


	return container;
}

export default command;
