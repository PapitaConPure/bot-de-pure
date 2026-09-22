import type { Guild } from 'discord.js';
import {
	ContainerBuilder,
	MessageFlags,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import type { AnyCommandInteraction } from 'types/commands';
import { tenshiColor } from '@/data/globalProps';
import { isValidLocaleKey, Locales, Translator } from '@/i18n';
import { type GuildConfigDocument, GuildConfigModel } from '@/models/guildconfigs';
import { compressId } from '@/utils/encoding';
import { recacheGuild } from '@/utils/guildcache';
import { Command, CommandPermissions, CommandTags } from '../commons';

const tags = new CommandTags().add('MOD', 'MAINTENANCE');

const permissions = new CommandPermissions().requireAnyOf(['ManageGuild']);

const command = new Command(
	{
		es: 'servidor',
		en: 'server',
		ja: 'server',
	},
	tags,
)
	.setAliases('server', 'guild', 'sv')
	.setBriefDescription(
		'Para ver y configurar las preferencias del servidor por medio de un Asistente',
	)
	.setLongDescription(
		'Para ver y configurar las preferencias del servidor.',
		'Si quieres cambiar alguna configuración, puedes presionar cualquier botón para proceder con el Asistente',
	)
	.setPermissions(permissions)
	.setExecution(async (request) => {
		const [translator, guildTranslator] = await Translator.from(request);
		const compressedUserId = compressId(request.userId);

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components: [
				makeDashboardContainer(
					compressedUserId,
					request.guild,
					translator,
					guildTranslator,
				),
			],
		});
	})
	.setSelectMenuResponse(
		async function selectLanguage(interaction, compressedUserId) {
			const { success, context } = await getWizardContext(interaction);
			if (!success) return;
			const { guild, guildConfigs, translator } = context;

			const newLocale = interaction.values[0];
			if (!newLocale || !isValidLocaleKey(newLocale)) return interaction.deleteReply();

			guildConfigs.locale = newLocale;
			const guildTranslator = new Translator(newLocale);

			await guildConfigs.save();
			await recacheGuild(guild);

			return interaction.update({
				flags: MessageFlags.IsComponentsV2,
				components: [
					makeDashboardContainer(compressedUserId, guild, translator, guildTranslator),
				],
			});
		},
		{ userFilterIndex: 0 },
	);

async function getWizardContext(
	request: AnyCommandInteraction & { guild: Guild },
	options: {
		notEphemeral?: boolean;
		editReply?: boolean;
	} = {},
): Promise<
	| {
			success: true;
			context: {
				guild: Guild;
				guildConfigs: GuildConfigDocument;
				translator: Translator;
				guildTranslator: Translator;
			};
	  }
	| { success: false; context: null }
> {
	const { notEphemeral = false, editReply = false } = options;
	const { guild } = request;

	const [translator, guildConfigs] = await Promise.all([
		Translator.fromUser(request),
		GuildConfigModel.findOne({ guildId: request.guild.id }),
	]);

	if (!guildConfigs) {
		const guildNotAvailableText = translator.getText('servidorGuildUnavailable');
		if (editReply) await request.editReply({ content: guildNotAvailableText });
		else
			await request.reply({
				content: guildNotAvailableText,
				flags: notEphemeral ? undefined : MessageFlags.Ephemeral,
			});

		return { success: false, context: null };
	}

	const guildTranslator = new Translator(guildConfigs.locale);

	return { success: true, context: { guild, guildConfigs, translator, guildTranslator } };
}

function makeDashboardContainer(
	compressedUserId: string,
	guild: Guild,
	translator: Translator,
	guildTranslator: Translator,
) {
	const container = new ContainerBuilder().setAccentColor(tenshiColor);
	const guildIcon = guild.iconURL({ size: 512 });

	if (guildIcon)
		container.addSectionComponents((section) =>
			section
				.addTextDisplayComponents(
					(textDisplay) =>
						textDisplay.setContent(translator.getText('serverDashboardServerEpigraph')),
					(textDisplay) => textDisplay.setContent(`## ${guild.name}`),
				)
				.setThumbnailAccessory((thumbnail) =>
					thumbnail
						.setDescription(translator.getText('infoGuildIconAlt'))
						.setURL(guildIcon),
				),
		);
	else
		container.addTextDisplayComponents(
			(textDisplay) =>
				textDisplay.setContent(translator.getText('serverDashboardServerEpigraph')),
			(textDisplay) => textDisplay.setContent(`## ${guild.name}`),
		);

	container
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(translator.getText('serverDashboardLanguageName')),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`server_selectLanguage_${compressedUserId}`)
					.setPlaceholder(translator.getText('languageMenuPlaceholder'))
					.setOptions(
						Object.values(Locales).map((locale) => {
							const subTranslator = new Translator(locale);
							return new StringSelectMenuOptionBuilder()
								.setLabel(subTranslator.getText('currentLanguage'))
								.setEmoji(subTranslator.getText('currentLanguageEmojiId'))
								.setValue(locale)
								.setDefault(guildTranslator.locale === subTranslator.locale);
						}),
					),
			),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents((actionRow) =>
			actionRow.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`server_selectConfig_${compressedUserId}`)
					.setPlaceholder(translator.getText('serverDashboardMenuConfig'))
					.setOptions([
						{
							label: 'Boorutato',
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
			),
		);

	return container;
}

export default command;
