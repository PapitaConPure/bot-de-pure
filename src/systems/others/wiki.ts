import type { AnyComponentBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	EmbedBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
} from 'discord.js';
import type { AnyRequest, ComplexCommandRequest, ComponentInteraction } from 'types/commands';
import type { MessageComponentDataResolvable } from 'types/discord';
import type {
	Command,
	CommandOptions,
	CommandTagResolvable,
	CommandTagStringField,
} from '@/commands/commons';
import { CommandTag, fetchCommandsFromFiles } from '@/commands/commons';
import { ClientNotFoundError, client } from '@/core/client';
import { tenshiColor } from '@/data/globalProps';
import userIds from '@/data/userIds.json';
import { compressId, edlDistance, isNotModerator, toCapitalized } from '@/func';
import { Translator } from '@/i18n';
import { p_pure } from '@/utils/prefixes';

export const makeCategoriesRow = async (
	request: ComplexCommandRequest | ComponentInteraction,
	selections: CommandTagResolvable[],
) => {
	const translator = await Translator.from(request);
	const getDefault = (d: CommandTagResolvable) => !!selections.includes(d);

	const categoriesMenu = new StringSelectMenuBuilder()
		.setCustomId(`ayuda_viewCategory_${compressId(request.user.id)}`)
		.setPlaceholder(translator.getText('wikiCommandCategoriesMenuPlaceholder'))
		.setMinValues(0)
		.setMaxValues(6)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('COMMON')
				.setEmoji('828736342372253697')
				.setLabel(translator.getText('wikiCommandCategoriesMenuOptionCommonLabel'))
				.setDescription(
					translator.getText('wikiCommandCategoriesMenuOptionCommonDescription'),
				)
				.setDefault(getDefault('COMMON')),
		);

	!isNotModerator(request.member)
		&& categoriesMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('MOD')
				.setEmoji('704612794921779290')
				.setLabel(translator.getText('wikiCommandCategoriesMenuOptionModLabel'))
				.setDescription(translator.getText('wikiCommandCategoriesMenuOptionModDescription'))
				.setDefault(getDefault('MOD')),
		);

	request.user.id === userIds.papita
		&& categoriesMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('PAPA')
				.setEmoji('797295151356969030')
				.setLabel(translator.getText('wikiCommandCategoriesMenuOptionPapaLabel'))
				.setDescription(
					translator.getText('wikiCommandCategoriesMenuOptionPapaDescription'),
				)
				.setDefault(getDefault('PAPA')),
			new StringSelectMenuOptionBuilder()
				.setValue('OUTDATED')
				.setEmoji('657367372285476905')
				.setLabel(translator.getText('wikiCommandCategoriesMenuOptionOutdatedLabel'))
				.setDescription(
					translator.getText('wikiCommandCategoriesMenuOptionOutdatedDescription'),
				)
				.setDefault(getDefault('OUTDATED')),
			new StringSelectMenuOptionBuilder()
				.setValue('MAINTENANCE')
				.setEmoji('🛠️')
				.setLabel(translator.getText('wikiCommandCategoriesMenuOptionMaintenanceLabel'))
				.setDescription(
					translator.getText('wikiCommandCategoriesMenuOptionMaintenanceDescription'),
				)
				.setDefault(getDefault('MAINTENANCE')),
		);

	categoriesMenu.addOptions(
		new StringSelectMenuOptionBuilder()
			.setValue('MUSIC')
			.setEmoji('🎵')
			.setLabel(translator.getText('wikiCommandCategoriesMenuOptionMusicLabel'))
			.setDescription(translator.getText('wikiCommandCategoriesMenuOptionMusicDescription'))
			.setDefault(getDefault('MUSIC')),
		new StringSelectMenuOptionBuilder()
			.setValue('MEME')
			.setEmoji('721973016455807017')
			.setLabel(translator.getText('wikiCommandCategoriesMenuOptionMemeLabel'))
			.setDescription(translator.getText('wikiCommandCategoriesMenuOptionMemeDescription'))
			.setDefault(getDefault('MEME')),
		new StringSelectMenuOptionBuilder()
			.setValue('GAME')
			.setEmoji('🎲')
			.setLabel(translator.getText('wikiCommandCategoriesMenuOptionGameLabel'))
			.setDescription(translator.getText('wikiCommandCategoriesMenuOptionGameDescription'))
			.setDefault(getDefault('GAME')),
		new StringSelectMenuOptionBuilder()
			.setValue('CHAOS')
			.setEmoji('👹')
			.setLabel(translator.getText('wikiCommandCategoriesMenuOptionChaosLabel'))
			.setDescription(translator.getText('wikiCommandCategoriesMenuOptionChaosDescription'))
			.setDefault(getDefault('CHAOS')),
	);

	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categoriesMenu);
};

export const makeGuideMenu = (request: AnyRequest, translator: Translator) =>
	new StringSelectMenuBuilder()
		.setCustomId(`ayuda_viewGuideWiki_${compressId(request.user.id)}`)
		.setPlaceholder(translator.getText('wikiGuideMenuPlaceholder'))
		.setOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('index')
				.setEmoji('📚')
				.setLabel(translator.getText('wikiGuideMenuOptionIntroLabel'))
				.setDescription(translator.getText('wikiGuideMenuOptionIntroDescription')),
			new StringSelectMenuOptionBuilder()
				.setValue('options')
				.setEmoji('🧮')
				.setLabel(translator.getText('wikiGuideMenuOptionOptionsLabel'))
				.setDescription(translator.getText('wikiGuideMenuOptionOptionsDescription')),
			new StringSelectMenuOptionBuilder()
				.setValue('params')
				.setEmoji('🎛️')
				.setLabel(translator.getText('wikiGuideMenuOptionParamsLabel'))
				.setDescription(translator.getText('wikiGuideMenuOptionParamsDescription')),
			new StringSelectMenuOptionBuilder()
				.setValue('types')
				.setEmoji('❔')
				.setLabel(translator.getText('wikiGuideMenuOptionParamTypesLabel'))
				.setDescription(translator.getText('wikiGuideMenuOptionParamTypesDescription')),
		);

export const makeGuideRow = (request: AnyRequest, translator: Translator) =>
	new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(makeGuideMenu(request, translator));

/**
 * @description
 * Devuelve un {@linkcode Command} según el `nameOrAlias` indicado.
 *
 * Si no se encuentran resultados, se devuelve `null`
 */
export async function searchCommand(request: AnyRequest, nameOrAlias: string) {
	const commands = await fetchCommandsFromFiles({
		filter: (command) =>
			command.name === nameOrAlias
			|| !!command.aliases?.some((alias) => alias === nameOrAlias),
	});

	for (const command of commands) {
		if (
			(command.tags.has('PAPA') && request.user.id !== userIds.papita)
			|| (command.tags.has('MOD') && isNotModerator(request.member))
		)
			continue;

		return command;
	}

	return null;
}

/**
 * @description
 * Devuelve un arreglo de objetos según la `query` proporcionada.
 *
 * Los objetos devueltos contienen un {@linkcode Command} y la distancia Damerau-Levenshtein con peso euclideano respecto a la `query`.
 *
 * Si no se encuentran resultados, se devuelve `null`.
 */
export async function searchCommands(request: AnyRequest, query: string) {
	const commandsWithDistance: { command: Command; distance: number }[] = [];

	const commands = await fetchCommandsFromFiles({
		excludeTags: CommandTag.GUIDE | CommandTag.MAINTENANCE | CommandTag.OUTDATED,
	});
	const nameBias = 0.334;

	for (const command of commands) {
		let distance = edlDistance(command.name, query);

		if (distance > 3) {
			if (!command.aliases) continue;

			distance =
				command.aliases
					.map((alias) => edlDistance(alias, query))
					.reduce((a, b) => (a < b ? a : b), 999) + nameBias;

			if (distance > 3) continue;
		}

		if (
			(command.tags.has('PAPA') && request.user.id !== userIds.papita)
			|| (command.tags.has('MOD') && isNotModerator(request.member))
		)
			continue;

		commandsWithDistance.push({
			command,
			distance,
		});
	}

	return commandsWithDistance;
}

/**@description Representa un objeto de carga útil para inyectar en una página de wiki de comando.*/
interface WikiPageInjectionPayload {
	embeds: EmbedBuilder[];
	components: ActionRowBuilder<AnyComponentBuilder>[];
}

/**@description Representa un objeto de carga útil para inyectar en una página de wiki de comando.*/
type WikiPageInjectionPayloadV2 = MessageComponentDataResolvable[];

const displayTagMappings = {
	GUIDE: (translator) => translator.getText('commandTagLabelGuide'),
	COMMON: (translator) => translator.getText('commandTagLabelCommon'),
	MOD: (translator) => translator.getText('commandTagLabelMod'),
	PAPA: (translator) => translator.getText('commandTagLabelPapa'),
	OUTDATED: (translator) => translator.getText('commandTagLabelOutdated'),
	MAINTENANCE: (translator) => translator.getText('commandTagLabelMaintenance'),
	SAKI: () => 'Saki Scans',
	MUSIC: (translator) => translator.getText('commandTagLabelMusic'),
	MEME: (translator) => translator.getText('commandTagLabelMeme'),
	GAME: (translator) => translator.getText('commandTagLabelGame'),
	CHAOS: (translator) => translator.getText('commandTagLabelChaos'),
} as const satisfies Record<CommandTagStringField, (translator: Translator) => string>;

const listExists = (l: string[] | null | undefined): l is string[] => !!l?.[0]?.length;

/**
 * @description Añade embeds y componentes de una wiki de comando a la carga indicada.
 * @deprecated
 */
export function injectWikiPage(
	command: Command<CommandOptions | undefined>,
	guildId: string,
	payload: WikiPageInjectionPayload,
) {
	const { name, aliases, flags } = command;
	const { embeds, components } = payload;

	const title = (commandName: string) => {
		const pfi = commandName.indexOf('-') + 1;
		commandName = flags.has('GUIDE')
			? `${commandName.slice(pfi)} (Página de Guía)`
			: commandName;
		commandName = flags.has('MOD') ? `${commandName} (Mod)` : commandName;
		commandName = flags.has('PAPA')
			? `${commandName.slice(pfi)} (Papita con Puré)`
			: commandName;
		return `${commandName[0].toUpperCase()}${commandName.slice(1)}`;
	};
	const isNotGuidePage = !flags.has('GUIDE');

	if (!client) throw new ClientNotFoundError();

	//Embed de metadatos
	embeds.push(
		new EmbedBuilder()
			.setColor(tenshiColor)
			.setAuthor({
				name: title(name),
				iconURL:
					client.user?.displayAvatarURL({ extension: 'png', size: 512 }) ?? undefined,
			})
			.addFields(
				{ name: 'Nombre', value: `\`${name}\``, inline: true },
				{
					name: 'Alias',
					value: listExists(aliases)
						? aliases.map((i) => `\`${i}\``).join(', ')
						: ':label: Sin alias',
					inline: true,
				},
				{
					name: 'Etiquetas',
					value: flags.keys.map((f) => `\`${f}\``).join(', '),
					inline: true,
				},
			),
	);

	//Embed de información
	const infoEmbed = new EmbedBuilder().setColor(0xbf94e4).addFields({
		name: 'Descripción',
		value:
			command.desc
			|| '⚠️ Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde',
	});

	embeds.push(infoEmbed);

	if (isNotGuidePage)
		infoEmbed.addFields(
			{
				name: 'Uso (plantilla)',
				value: `\`${p_pure(guildId).raw}${command.name}${command.callx ? ` ${command.callx}` : ''}\``,
			},
			{ name: 'Opciones', value: command.options?.display || ':abacus: Sin opciones' },
		);

	components.push(
		new ActionRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId('ayuda_porfavorayuden')
				.setLabel('Muéstrame cómo')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('📖')
				.setDisabled(true),
		]),
	);
}

/**@description Añade embeds y componentes de una wiki de comando a la carga indicada (utiliza Componentes V2).*/
export function getWikiPageComponentsV2(
	command: Command<CommandOptions | undefined>,
	request: ComplexCommandRequest,
	translator: Translator,
): WikiPageInjectionPayloadV2 {
	const { name: commandName, aliases, flags: commandTags } = command;

	const components: WikiPageInjectionPayloadV2 = [];

	const getDisplayFlags = () =>
		`${commandTags.keys.map((t) => displayTagMappings[t](translator)).join(', ')}`;
	const isNotGuidePage = !commandTags.has('GUIDE');

	//Contenedor de metadatos
	const titleTextBuilder = new TextDisplayBuilder().setContent(
		isNotGuidePage
			? `# <:command:1369424059871395950> ${toCapitalized(commandName)}`
			: `# <:guide:1369552945309290647> ${toCapitalized(commandName.slice(2))}`,
	);
	const taglineTextBuilder = new TextDisplayBuilder().setContent(
		isNotGuidePage ? `-# Comando • ${getDisplayFlags()}` : `-# ${getDisplayFlags()}`,
	);

	const metadataContainerBuilder = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(titleTextBuilder, taglineTextBuilder);

	if (isNotGuidePage) {
		const namesHeaderTextBuilder = new TextDisplayBuilder().setContent(
			translator.getText('wikiCommandIdentifiersName'),
		);
		const namesContent = `\`${commandName}\`, ${listExists(aliases) ? aliases.map((i) => `\`${i}\``).join(', ') : ''}`;
		const namesTextBuilder = new TextDisplayBuilder().setContent(namesContent);

		metadataContainerBuilder
			.addSeparatorComponents(new SeparatorBuilder())
			.addTextDisplayComponents(namesHeaderTextBuilder, namesTextBuilder);
	}

	components.push(metadataContainerBuilder);

	//Contenedor de información
	const infoContainerBuilder = new ContainerBuilder().setAccentColor(0xbf94e4);

	if (isNotGuidePage) {
		const descriptionHeaderTextBuilder = new TextDisplayBuilder().setContent(
			translator.getText('wikiCommandDescriptionName'),
		);
		infoContainerBuilder.addTextDisplayComponents(descriptionHeaderTextBuilder);
	}

	const descriptionTextBuilder = new TextDisplayBuilder().setContent(
		command.desc || translator.getText('wikiCommandDescriptionNoDescription'),
	);

	const wikiRows = command.wiki.rows.map((row) =>
		new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			row.map((componentEvaluator) => componentEvaluator(request, translator)),
		),
	);

	infoContainerBuilder
		.addTextDisplayComponents(descriptionTextBuilder)
		.addActionRowComponents(wikiRows);

	components.push(infoContainerBuilder);

	if (isNotGuidePage) {
		const showMeHowButton = new ButtonBuilder()
			.setCustomId('help_porfavorayuden')
			.setLabel(translator.getText('wikiCommandUsageTryItButton'))
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true);

		const usageHeaderTextBuilder = new TextDisplayBuilder().setContent(
			translator.getText('wikiCommandUsageName'),
		);
		const usageTextBuilder = new TextDisplayBuilder().setContent(
			`\`\`\`bnf\n${p_pure(request).raw}${commandName}${command.callx ? ` ${command.callx}` : ''}\n\`\`\``,
		);
		const usageSectionBuilder = new SectionBuilder()
			.addTextDisplayComponents(usageHeaderTextBuilder, usageTextBuilder)
			.setButtonAccessory(showMeHowButton);

		infoContainerBuilder
			.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
			.addSectionComponents(usageSectionBuilder)
			.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));

		if (command.options?.display) {
			const composeButton = new ButtonBuilder()
				.setCustomId('help_compose')
				.setLabel(translator.getText('wikiCommandOptionsComposeButton'))
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);

			const optionsHeaderTextBuilder = new TextDisplayBuilder().setContent(
				translator.getText('wikiCommandOptionsName'),
			);
			const optionsTextBuilder = new TextDisplayBuilder().setContent(
				command.options?.display,
			);
			const optionsSectionBuilder = new SectionBuilder()
				.addTextDisplayComponents(optionsHeaderTextBuilder, optionsTextBuilder)
				.setButtonAccessory(composeButton);

			infoContainerBuilder.addSectionComponents(optionsSectionBuilder);
		} else {
			const optionsTextBuilder = new TextDisplayBuilder().setContent(
				translator.getText('wikiCommandOptionsNoOptions'),
			);
			infoContainerBuilder.addTextDisplayComponents(optionsTextBuilder);
		}
	}

	return components;
}
