import type {
	AnyComponentBuilder,
	MessageActionRowComponentBuilder,
	MessageComponentInteraction,
} from 'discord.js';
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
import type { Command, CommandOptions, CommandTagStringField } from '@/commands/commons';
import { CommandTag, fetchCommandsFromFiles } from '@/commands/commons';
import { ClientNotFoundError, client } from '@/core/client';
import { tenshiColor } from '@/data/globalProps';
import serverIds from '@/data/serverIds.json';
import userIds from '@/data/userIds.json';
import { compressId, edlDistance, isNotModerator, toCapitalized } from '@/func';
import { p_pure } from '@/utils/prefixes';

export const makeCategoriesRow = (
	request: ComplexCommandRequest | ComponentInteraction,
	selections: string[],
) => {
	const getDefault = (d: string) => !!selections.includes(d);

	const categoriesMenu = new StringSelectMenuBuilder()
		.setCustomId(`ayuda_viewCategory_${compressId(request.user.id)}`)
		.setPlaceholder('Categorías de Comandos...')
		.setMinValues(0)
		.setMaxValues(6)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('COMMON')
				.setEmoji('828736342372253697')
				.setLabel('General')
				.setDescription('Comandos comunes, de propósito general.')
				.setDefault(getDefault('COMMON')),
		);

	!isNotModerator(request.member)
		&& categoriesMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('MOD')
				.setEmoji('704612794921779290')
				.setLabel('Moderación')
				.setDescription('Comandos limitados a moderadores.')
				.setDefault(getDefault('MOD')),
		);

	request.user.id === userIds.papita
		&& categoriesMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('PAPA')
				.setEmoji('797295151356969030')
				.setLabel('Papita con Puré')
				.setDescription('Comandos restringidos a Papita con Puré.')
				.setDefault(getDefault('PAPA')),
			new StringSelectMenuOptionBuilder()
				.setValue('OUTDATED')
				.setEmoji('657367372285476905')
				.setLabel('Desactualizado')
				.setDescription('Comandos en desuso, ya no pueden llamarse.')
				.setDefault(getDefault('OUTDATED')),
			new StringSelectMenuOptionBuilder()
				.setValue('MAINTENANCE')
				.setEmoji('🛠️')
				.setLabel('En mantenimiento')
				.setDescription('Comandos en desarrollo o mantenimiento.')
				.setDefault(getDefault('MAINTENANCE')),
		);

	request.guildId === serverIds.saki
		&& categoriesMenu.addOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('SAKI')
				.setEmoji('1108197083334316183')
				.setLabel('Saki Scans')
				.setDescription('Comandos exclusivos para Saki Scans.')
				.setDefault(getDefault('SAKI')),
		);

	categoriesMenu.addOptions(
		new StringSelectMenuOptionBuilder()
			.setValue('MUSIC')
			.setEmoji('🎵')
			.setLabel('Música')
			.setDescription('Comandos PuréMusic para reproducir música.')
			.setDefault(getDefault('MUSIC')),
		new StringSelectMenuOptionBuilder()
			.setValue('EMOTE')
			.setEmoji('704612794921779290')
			.setLabel('Emotes')
			.setDescription('Comandos de emotes. Puedes llamarlos &así.')
			.setDefault(getDefault('EMOTE')),
		new StringSelectMenuOptionBuilder()
			.setValue('MEME')
			.setEmoji('721973016455807017')
			.setLabel('Memes')
			.setDescription('Comandos de carácter memético.')
			.setDefault(getDefault('MEME')),
		new StringSelectMenuOptionBuilder()
			.setValue('GAME')
			.setEmoji('🎲')
			.setLabel('Juegos')
			.setDescription('Comandos de juego y/o fiesta.')
			.setDefault(getDefault('GAME')),
		new StringSelectMenuOptionBuilder()
			.setValue('CHAOS')
			.setEmoji('👹')
			.setLabel('Caos')
			.setDescription('Comandos caóticos. Requieren habilitarse.')
			.setDefault(getDefault('CHAOS')),
	);

	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categoriesMenu);
};

export const makeGuideMenu = (
	request: ComplexCommandRequest | MessageComponentInteraction<'cached'>,
) =>
	new StringSelectMenuBuilder()
		.setCustomId(`ayuda_viewGuideWiki_${compressId(request.user.id)}`)
		.setPlaceholder('Guías...')
		.setOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('index')
				.setEmoji('📚')
				.setLabel('Guía Introductoria')
				.setDescription('Pantallazo general del modo de utilización de Bot de Puré.'),
			new StringSelectMenuOptionBuilder()
				.setValue('options')
				.setEmoji('🧮')
				.setLabel('Guía de Opciones')
				.setDescription('Información acerca de las Opciones de Comando.'),
			new StringSelectMenuOptionBuilder()
				.setValue('params')
				.setEmoji('🎛️')
				.setLabel('Guía de Parámetros')
				.setDescription('Explicación detallada sobre los Parámetros de Comando.'),
			new StringSelectMenuOptionBuilder()
				.setValue('types')
				.setEmoji('❔')
				.setLabel('Guía de Tipos de Parámetro')
				.setDescription('Detalles sobre los Tipos de Parámetro u Expresiones de Bandera.'),
		);

export const makeGuideRow = (
	request: ComplexCommandRequest | MessageComponentInteraction<'cached'>,
) => new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(makeGuideMenu(request));

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
			|| (command.tags.has('SAKI') && request.guild.id !== serverIds.saki)
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
			|| (command.tags.has('SAKI') && request.guild.id !== serverIds.saki)
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
	GUIDE: 'Página de Guía',
	MOD: 'Mod',
	PAPA: 'Papita con Puré',
	MAINTENANCE: 'Mantenimiento',
	OUTDATED: 'Obsoleto',
	SAKI: 'Saki Scans',
	CHAOS: 'Caos',
	COMMON: 'Común',
	EMOTE: 'Emote',
	GAME: 'Juego',
	MEME: 'Meme',
	MUSIC: 'Música',
} as const satisfies Record<CommandTagStringField, string>;

const listExists = (l: string[] | null | undefined): l is string[] => !!l?.[0]?.length;

/**@description Añade embeds y componentes de una wiki de comando a la carga indicada.*/
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
): WikiPageInjectionPayloadV2 {
	const { name: commandName, aliases, flags: commandTags } = command;

	const components: WikiPageInjectionPayloadV2 = [];

	const getDisplayFlags = () =>
		`${commandTags.keys.map((t) => displayTagMappings[t]).join(', ')}`;
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

	const namesHeaderTextBuilder = new TextDisplayBuilder().setContent('### Nombres');
	const namesContent = `\`${commandName}\`, ${listExists(aliases) ? aliases.map((i) => `\`${i}\``).join(', ') : ''}`;
	const namesTextBuilder = new TextDisplayBuilder().setContent(namesContent);

	const metadataContainerBuilder = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(titleTextBuilder, taglineTextBuilder)
		.addSeparatorComponents(new SeparatorBuilder())
		.addTextDisplayComponents(namesHeaderTextBuilder, namesTextBuilder);

	components.push(metadataContainerBuilder);

	//Contenedor de información
	const descriptionHeaderTextBuilder = new TextDisplayBuilder().setContent(
		isNotGuidePage ? '### Descripción' : '### Explicación',
	);
	const descriptionTextBuilder = new TextDisplayBuilder().setContent(
		command.desc
			|| '⚠️ Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde',
	);

	const wikiRows = command.wiki.rows.map((row) =>
		new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
			row.map((componentEvaluator) => componentEvaluator(request)),
		),
	);
	const infoContainerBuilder = new ContainerBuilder()
		.setAccentColor(0xbf94e4)
		.addTextDisplayComponents(descriptionHeaderTextBuilder, descriptionTextBuilder)
		.addActionRowComponents(wikiRows);

	components.push(infoContainerBuilder);

	if (isNotGuidePage) {
		const showMeHowButton = new ButtonBuilder()
			.setCustomId('ayuda_porfavorayuden')
			.setLabel('Probar')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true);

		const usageHeaderTextBuilder = new TextDisplayBuilder().setContent('### Uso (plantilla)');
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
				.setCustomId('ayuda_compose')
				.setLabel('Componer...')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);

			const optionsHeaderTextBuilder = new TextDisplayBuilder().setContent('### Opciones');
			const optionsTextBuilder = new TextDisplayBuilder().setContent(
				command.options?.display,
			);
			const optionsSectionBuilder = new SectionBuilder()
				.addTextDisplayComponents(optionsHeaderTextBuilder, optionsTextBuilder)
				.setButtonAccessory(composeButton);

			infoContainerBuilder.addSectionComponents(optionsSectionBuilder);
		} else {
			const optionsTextBuilder = new TextDisplayBuilder().setContent(
				':abacus: _Sin opciones._',
			);
			infoContainerBuilder.addTextDisplayComponents(optionsTextBuilder);
		}
	}

	return components;
}
