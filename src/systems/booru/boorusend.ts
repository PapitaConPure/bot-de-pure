import {
	type BooruClient,
	type Post,
	type Tag,
	type TagType,
	TagTypes,
} from '@papitaconpure/booru-client';
import { addMinutes, isPast } from 'date-fns';
import type {
	ActionRow,
	ButtonComponent,
	Collection,
	GuildMember,
	Message,
	Snowflake,
	TopLevelComponent,
} from 'discord.js';
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ComponentType,
	ContainerBuilder,
	EmbedBuilder,
	MessageFlags,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from 'discord.js';
import type { ComplexCommandRequest } from 'types/commands';
import { Command, type CommandOptionSolver } from '@/commands/commons';
import { tenshiPeachColor } from '@/data/globalProps';
import userIds from '@/data/userIds.json';
import { Translator } from '@/i18n';
import {
	defaultMaxGeneralTags,
	defaultMaxSpecialTags,
	maxAllowedTotalSpecialTags,
} from '@/models/feeds';
import { isNSFWChannel } from '@/utils/discord';
import { type BotEmojiName, getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import { fetchExt } from '@/utils/fetchext';
import Logger from '@/utils/logs';
import { shortenText } from '@/utils/misc';
import { getMainBooruClient } from './booruclient';
import type { FeedOptions } from './boorufeed';
import type { tagMaps } from './booruprops';
import { getBaseTags, getSearchTags } from './booruprops';
import { type BooruSourceStyle, BooruSourceStylesList } from './boorusources';

const { debug, info, warn, error } = Logger('WARN', 'BooruSend');

export interface PostFormatData {
	manageableBy?: string | null;
	allowNSFW?: boolean | null;
	isNotFeed?: boolean | null;
	disableLinks?: boolean | null;
	disableActions?: boolean | null;
	componentKey?: number | string;
}

/**
 * Algunos enlaces pueden pertenecer a dominios asociados de un sitio para alojar recursos. Cosas como enlaces de CDNs.
 * Estos enlaces generalmente expiran y no tienen un patrón reconocible para darles estilo, por lo que deben ser convertidos a enlaces de las publicaciones que contienen el recurso.
 * Aquellos con conversiones conocidas aparecen en este mapeado para recuperar el enlace de publicación al que están asociados
 */
const sourceMappings: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
	{
		pattern:
			/https:\/\/i\.pximg\.net\/img-original\/img\/[0-9/]{19}\/([0-9]+)_p[0-9]+\.[A-Za-z]{2,4}/,
		replacement: 'https://www.pixiv.net/artworks/$1',
	},
	{
		pattern:
			/https:\/\/booth\.pximg\.net\/[0-9a-z]+(?:-[0-9a-z]+){4}\/i\/([0-9]+)\/[0-9a-z]+(?:-[0-9a-z]+){4}(?:[a-z_]+)?\.[a-z0-9]{2,4}/,
		replacement: 'https://booth.pm/en/items/$1',
	},
];

const noSource: BooruSourceStyle = { color: Colors.Aqua, emoji: undefined };
const unknownSource: BooruSourceStyle = { color: tenshiPeachColor, emoji: 'heartAccent' };

/**Solo se debe mostrar la tag de resolución más alta por Post.*/
const resMappings = {
	lowres: { order: 0, emote: 'lowRes' },
	highres: { order: 1, emote: 'highRes' },
	absurdres: { order: 2, emote: 'absurdRes' },
	incredibly_absurdres: { order: 3, emote: 'incrediblyAbsurdRes' },
} as const satisfies Record<string, { order: number; emote: BotEmojiName }>;

const sexEmotes = {
	girl: 'girl',
	boy: 'boy',
	futa: 'futa',
} as const satisfies Record<string, BotEmojiName>;

const ignoredTagsIfSexCount = new Set<string>(['multiple_girls', 'multiple_boys', 'multiple_futa']);

interface SpecialTagGroup {
	source: Tag[];
	max: number;
	output: string[];
}

/**
 * Genera un {@linkcode ContainerBuilder} a base de un {@linkcode Post} de {@linkcode Booru}
 * @param booru Instancia de Booru
 * @param post Post de Booru
 * @param data Información adicional a mostrar en el Embed. Se puede pasar un Feed directamente
 */
export async function formatBooruPostMessage(
	booru: BooruClient,
	post: Post,
	data: Omit<FeedOptions, 'lastFetchedAt' | 'faults'> & PostFormatData = {},
): Promise<{ container: ContainerBuilder; attachment: AttachmentBuilder | null }> {
	info('Se recibió una solicitud de formato de mensaje con Post de Booru');

	const { allowNSFW = false, disableLinks = false, disableActions = false, componentKey } = data;

	const componentKeySuffix = componentKey ? `_${componentKey}` : '';

	let containerColor = noSource.color;
	const buttonRow = new ActionRowBuilder<ButtonBuilder>();

	//Booru Post button
	buttonRow.addComponents(
		new ButtonBuilder()
			.setEmoji(getBotEmojiResolvable('gelbooruColor'))
			.setStyle(ButtonStyle.Link)
			.setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`)
			.setDisabled(disableLinks ?? false),
	);

	//Apply source style and button
	debug('Se está por decidir el estilo del Embed del mensaje');
	if (post.source) {
		debug('El Post tiene fuentes. Se buscarán enlaces');
		debug('sources =', post.sources);

		const sourceUrl = post.findFirstUrlSource();
		debug('sourceUrl =', sourceUrl);

		if (sourceUrl) {
			debug(
				'El Post tiene enlaces como fuentes. Se aplicará un botón de enlace a fuente y el estilo de la fuente primaria',
			);
			const result = getSourceButtonAndColor(sourceUrl);
			buttonRow.addComponents(result.sourceButton);
			containerColor = result.containerColor;
		} else {
			debug('El Post no tiene enlaces como fuentes. Se aplicará un botón de texto plano');
			buttonRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_plainText${componentKeySuffix}`)
					.setStyle(ButtonStyle.Secondary)
					.setLabel(shortenText(post.source, 72))
					.setDisabled(true),
			);
		}
	}

	//Filter tags with special styling
	debug('A punto de procesar tags especiales');
	let hasTagMe = false;
	let hasRequestTags = false;
	const processedPostTags = post.tags.filter((t) => {
		if (t === 'tagme') {
			hasTagMe = true;
			return false;
		}

		if (t.endsWith('_request')) {
			//"commentary_request" tends to come from Danbooru, and artist context is ignored on Gelbooru
			hasRequestTags = t !== 'commentary_request';
			return false;
		}

		return true;
	});

	debug('omittedTags =', data.omittedTags);
	debug('hasTagMe =', hasTagMe);
	debug('hasRequestTags =', hasRequestTags);
	debug('processedPostTags =', processedPostTags);

	debug('Aplicando botones adicionales...');

	//Tags button
	buttonRow.addComponents(
		new ButtonBuilder()
			.setEmoji(getBotEmojiResolvable('tagWhite'))
			.setStyle(ButtonStyle.Primary)
			.setCustomId(
				`feed_showFeedImageTags_${data.isNotFeed ? 'NaF' : ''}${componentKeySuffix}`,
			)
			.setDisabled(!!disableActions),
	);

	//Contribution button
	if (hasTagMe || hasRequestTags)
		buttonRow.addComponents(
			new ButtonBuilder()
				.setEmoji(getBotEmojiResolvable('handshakeWhite'))
				.setStyle(ButtonStyle.Success)
				.setCustomId(`feed_contribute${componentKeySuffix}`)
				.setDisabled(!!disableActions),
		);

	//Deletion button
	buttonRow.addComponents(
		new ButtonBuilder()
			.setEmoji(getBotEmojiResolvable('xmarkWhite'))
			.setStyle(ButtonStyle.Danger)
			.setCustomId(
				`feed_deletePost_${data.manageableBy ?? ''}_${data.isNotFeed ?? ''}${componentKeySuffix}`,
			)
			.setDisabled(!!disableActions),
	);

	//Prepare final container
	info('Se comenzará a preparar el contenedor final del Post');
	const container = new ContainerBuilder().setAccentColor(containerColor);

	//Subtitle (doesn't add separator)
	if (data.subtitle)
		container.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(`-# ${data.subtitle}`),
		);

	//Title (only add separator if there's a title)
	if (data.title)
		container
			.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`## ${data.title}`))
			.addSeparatorComponents((separator) => separator.setDivider(true));

	//Previsualización
	debug('Comprobando bloqueo de contenido explícito de Post según el canal del mensaje');
	const shouldBlock =
		(post.rating === 'explicit' || post.rating === 'questionable') && !allowNSFW;

	let previewImage: AttachmentBuilder | null = null;

	if (shouldBlock) {
		container.addMediaGalleryComponents((mediaGallery) =>
			mediaGallery.addItems((mediaGalleryItem) =>
				mediaGalleryItem.setURL('https://files.catbox.moe/m5gvo4.jpg'),
			),
		);
	} else {
		if (post.previewUrl != null) previewImage = await getPostAttachment(post, 'previewUrl');

		container.addMediaGalleryComponents((mediaGallery) =>
			mediaGallery.addItems((mediaGalleryItem) =>
				mediaGalleryItem.setURL(`attachment://${previewImage?.name}`),
			),
		);
	}

	//Tags
	debug('A punto de intentar procesar las tags del Post');
	const maxTags = data.maxGeneralTags ?? defaultMaxGeneralTags;
	const actualTotalTags = processedPostTags.length;
	try {
		let thumbnailUrl: string | undefined;
		debug('Obteniendo información adicional de tags...');
		const postTags = (await booru.fetchPostTags(post)).filter(
			(t) => !data.omittedTags?.includes(t.name),
		);

		//Advertencia de IA
		debug('Determining Container thumbnail...');
		const aiGeneratedTagIndex = postTags.findIndex((t) =>
			['ai-generated', 'ai-assisted'].includes(t.name),
		);
		if (aiGeneratedTagIndex >= 0) {
			postTags.splice(aiGeneratedTagIndex, 1);
			thumbnailUrl = 'https://i.imgur.com/1Q41hhC.png';
		}

		debug('Distributing tags into categories...');
		const specialTagTypes: TagType[] = [
			TagTypes.ARTIST,
			TagTypes.CHARACTER,
			TagTypes.COPYRIGHT,
		];

		const postArtistTags: string[] = [];
		const postCharacterTags: string[] = [];
		const postCopyrightTags: string[] = [];
		const postOtherTags: string[] = [];

		const specialTagGroups = new Map<TagType, SpecialTagGroup>([
			[
				TagTypes.ARTIST,
				{
					source: [],
					max: data.maxArtistTags ?? defaultMaxSpecialTags,
					output: postArtistTags,
				},
			],
			[
				TagTypes.CHARACTER,
				{
					source: [],
					max: data.maxCharacterTags ?? defaultMaxSpecialTags,
					output: postCharacterTags,
				},
			],
			[
				TagTypes.COPYRIGHT,
				{
					source: [],
					max: data.maxCopyrightTags ?? defaultMaxSpecialTags,
					output: postCopyrightTags,
				},
			],
		]);

		postTags.forEach((tag) => {
			const specialTagGroup = specialTagGroups.get(tag.type);
			if (specialTagGroup) specialTagGroup.source.push(tag);
			else postOtherTags.push(tag.name);
		});

		//Cap special tags uniformly (bound to type and total maximum)
		for (
			let round = 0, totalSpecialTags = 0;
			totalSpecialTags < maxAllowedTotalSpecialTags;
			round++
		) {
			let added = false;

			for (const specialTagType of specialTagTypes) {
				const specialTagGroup = specialTagGroups.get(specialTagType) as SpecialTagGroup;

				if (
					round < specialTagGroup.source.length
					&& specialTagGroup.output.length < specialTagGroup.max
				) {
					specialTagGroup.output.push(specialTagGroup.source[round].name);
					totalSpecialTags++;
					added = true;

					if (totalSpecialTags >= maxAllowedTotalSpecialTags) break;
				}
			}

			if (!added) break;
		}

		const { highestResTag, sexTags, remainingTags } = extractSpecialTags(postOtherTags);

		if (sexTags.size)
			for (const ignoredTagIfSexCount of ignoredTagsIfSexCount)
				remainingTags.delete(ignoredTagIfSexCount);

		debug('- - - - - - - - - - - - - - - - - -');
		debug('artistTags =', postArtistTags);
		debug('characterTags =', postCharacterTags);
		debug('copyrightTags =', postCopyrightTags);
		debug('generalTags =', postOtherTags);
		debug('- - - - - - - - - - - - - - - - - -');
		debug('highestResTag =', highestResTag);
		debug('sexTags =', sexTags);
		debug('remainingTags =', remainingTags);
		debug('- - - - - - - - - - - - - - - - - -');

		const specialTags = [
			...sexTags,
			...(highestResTag ? [getBotEmoji(highestResTag.emote)] : []),
		];
		const allDisplayedTags = [...specialTags, ...[...remainingTags].map(formatTagName)].slice(
			0,
			maxTags,
		);
		const displayedTagsCount = allDisplayedTags.length;
		const generalTagsTitle = `${getBotEmoji('tagAccent')} (${displayedTagsCount}/${actualTotalTags})`;
		const generalTagsContent = allDisplayedTags.join(' ').trim();
		const postGeneralTags = shortenText(`-# ${generalTagsTitle} ${generalTagsContent}`, 1020);

		const getCategoryFieldString = (fieldName: string, specialTagGroup: SpecialTagGroup) => {
			if (!specialTagGroup.output.length) return;

			const content = formatTagNameList(specialTagGroup.output, ' ');
			if (!content.length) return;

			const partialCount = specialTagGroup.output.length;
			const totalCount = specialTagGroup.source.length;

			const infoSuffix = partialCount < totalCount ? ` (${partialCount}/${totalCount})` : '';

			return `${fieldName.trim()}${infoSuffix} ${shortenText(content.trim(), 320)}`;
		};

		if (postArtistTags.length + postCharacterTags.length + postCopyrightTags.length > 0) {
			debug('About to compose tags into container...');
			container.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					[
						maxTags > 0 ? '###' : '',
						getCategoryFieldString(
							getBotEmoji('artistTagAccent'),
							specialTagGroups.get(TagTypes.ARTIST) as SpecialTagGroup,
						),
						getCategoryFieldString(
							getBotEmoji('characterTagAccent'),
							specialTagGroups.get(TagTypes.CHARACTER) as SpecialTagGroup,
						),
						getCategoryFieldString(
							getBotEmoji('copyrightTagAccent'),
							specialTagGroups.get(TagTypes.COPYRIGHT) as SpecialTagGroup,
						),
					]
						.join(' ')
						.trim(),
				),
			);
		} else debug('No special tags detected. Categorization omitted.');

		debug('Checking if a component for general tags should be added.');
		debug('displayedTagsCount =', displayedTagsCount);
		if (displayedTagsCount > 0) {
			if (thumbnailUrl) {
				debug('About to add a section to display general tags...');
				container.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((textDisplay) =>
							textDisplay.setContent(postGeneralTags),
						)
						.setThumbnailAccessory((accessory) => accessory.setURL(thumbnailUrl)),
				);
			} else {
				debug('About to add text to display general tags...');
				container.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(postGeneralTags),
				);
			}
		}
	} catch (err) {
		error(
			err,
			'Ocurrió un problema al procesar y formatear las tags de un Post de Booru para un mensaje.',
		);
		info('Intentando formatear tags con método alternativo sin categorización.');

		const postTags = processedPostTags;
		const displayedTags = postTags.slice(0, maxTags);
		const displayedTagsCount = displayedTags.length;

		debug('Comprobando si se debe insertar un campo de tags.');
		debug('displayedTagsCount =', displayedTagsCount);
		if (displayedTagsCount > 0) {
			debug('A punto de insertar un campo de tags');
			const generalTagsTitle = `${getBotEmoji('tagAccent')} (${displayedTagsCount}/${actualTotalTags})`;
			const generalTagsContent = `${formatTagNameList(displayedTags, ' ')}`.trim();
			const postGeneralTags = shortenText(
				`-# ${generalTagsTitle} ${generalTagsContent}`,
				1020,
			);
			container.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(postGeneralTags),
			);
		}
	}

	info('Adding buttons.');
	container
		.addSeparatorComponents((separator) =>
			separator
				.setDivider(true)
				.setSpacing(maxTags > 0 ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small),
		)
		.addActionRowComponents(buttonRow);

	info('Finished formatting container for Booru Post.');

	return { container, attachment: previewImage };
}

function extractSpecialTags(tags: Iterable<string>) {
	let highestResTag: { order: number; emote: BotEmojiName } | undefined;
	const sexTags = new Set<string>();
	const remainingTags = new Set<string>();

	for (const tag of tags) {
		//Set this tag as specially displayed if it's the highest resolution tag
		const resMapping = resMappings[tag];
		if (resMapping) {
			if (highestResTag == null || resMapping.order > highestResTag.order)
				highestResTag = resMapping;
			continue;
		}

		//Set this tag as specially displayed if it's a "1girl/1boy/1futa"-type tag
		const sexTag = tag.match(/([1-9]\+?)(girl|boy|futa)s?/);
		if (sexTag) {
			sexTags.add(`${getBotEmoji(sexEmotes[sexTag[2]])}${sexTag[1]}`);
			continue;
		}

		remainingTags.add(tag);
	}

	return { sexTags, highestResTag, remainingTags };
}

/**@description Devuelve un botón y color de contenedor para la fuente especificada (si está disponible).*/
function getSourceButtonAndColor(
	source: string,
	options: { disableLinks?: boolean; componentKey?: number | string } = {},
) {
	const { disableLinks = false, componentKey } = options;

	debug('Antes de mapeos de fuente:', source);
	sourceMappings.forEach((mapping) => {
		source = source.replace(mapping.pattern, mapping.replacement);
	});
	debug('Después de mapeos de fuente:', source);

	//Dar estilo a Embed según fuente de la imagen
	const sourceStyle = BooruSourceStylesList.find((s) => s.pattern.test(source)) ?? unknownSource;
	const buttonEmoji = sourceStyle.emoji;
	const containerColor = sourceStyle.color;
	const sourceTooLong = source.length > 512;

	if (sourceTooLong) warn('El texto de una fuente del Post sobrepasa los 512 caracteres');

	const sourceButton = sourceTooLong
		? new ButtonBuilder()
				.setStyle(ButtonStyle.Danger)
				.setCustomId(`feed_invalidUrl${componentKey ? `_${componentKey}` : ''}`)
				.setDisabled(true)
		: new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(source).setDisabled(!!disableLinks);

	if (buttonEmoji) sourceButton.setEmoji(getBotEmojiResolvable(buttonEmoji));

	return { sourceButton, containerColor };
}

export interface Subscription {
	userId: Snowflake;
	followedTags: string[];
}

/**@description Envía una notificación de {@linkcode Post} de {@linkcode Booru} a todos los {@linkcode User} suscriptos a las tags del mismo.*/
export async function notifyUsers(
	post: Post,
	sent: Message<true>,
	members: Collection<Snowflake, GuildMember>,
	feedSuscriptions: Subscription[],
) {
	info(
		'Se recibió una orden para notificar sobre un nuevo Post a usuarios suscriptos aplicables',
	);

	//No sé qué habré estado pensando cuando escribí esto, pero no pienso volver a tocarlo

	if (!sent) throw new Error('Se esperaba un mensaje para el cuál notificar');

	if (!sent.components) throw new Error('Se esperaba un mensaje de Feed válido');

	debug('Obtaining container and buttons row from message...');
	const container = sent.components.find((c) => c.type === ComponentType.Container);
	const containerButtonRow = getPostButtonsFromComponents(sent.components);
	if (!container || !containerButtonRow) throw new Error('Se esperaba un mensaje de Feed válido');

	const channel = sent.channel;
	if (!channel) throw new Error('No se encontró un canal para el mensaje enviado');

	const matchingSuscriptions = feedSuscriptions.filter((suscription) =>
		suscription.followedTags.some((tag) => post.tags.includes(tag)),
	);
	if (!matchingSuscriptions.length) {
		info('No se encontraron suscripciones aplicables para el Post procesado');
		return [];
	}

	info('Se encontraron suscripciones aplicables, intentando enviar notificaciones...');
	return Promise.all(
		matchingSuscriptions.map(async ({ userId, followedTags }) => {
			const member = members.get(userId);
			if (!channel || !member) return Promise.resolve(null);

			const translator = await Translator.fromUser(member);
			const matchingTags = followedTags.filter((tag) => post.tags.includes(tag));

			const userContainer = new ContainerBuilder().setAccentColor(
				container.accentColor ?? 0x0,
			);

			const titleTextDisplay = new TextDisplayBuilder().setContent(
				`## ${translator.getText('booruNotifTitle')}`,
			);
			const descTextDisplay = new TextDisplayBuilder().setContent(
				`${translator.getText('booruNotifDescription')}`,
			);
			const originalAttachmentURL = post.previewUrl
				? getAttachmentURLFromPostMessage(sent)
				: undefined;

			if (originalAttachmentURL != null) {
				userContainer.addSectionComponents((section) =>
					section
						.addTextDisplayComponents(titleTextDisplay, descTextDisplay)
						.setThumbnailAccessory((accessory) =>
							accessory.setURL(originalAttachmentURL),
						),
				);
			} else {
				userContainer.addTextDisplayComponents(titleTextDisplay, descTextDisplay);
			}

			userContainer
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((textDisplay) =>
							textDisplay.setContent([`### -# Feed`, `${channel}`].join('\n')),
						)
						.setButtonAccessory(
							new ButtonBuilder()
								.setURL(sent.url)
								.setEmoji(getBotEmojiResolvable('eyeAccent'))
								.setStyle(ButtonStyle.Link),
						),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						[
							`### -# ${translator.getText('booruNotifTagsName')}`,
							`\`\`\`\n${matchingTags.join(' ')}\n\`\`\``,
						].join('\n'),
					),
				)
				.addSeparatorComponents((separator) =>
					separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
				);

			const postRow = new ActionRowBuilder<ButtonBuilder>();
			const dangerButtonBuilders: ButtonBuilder[] = [];

			for (const button of containerButtonRow.components) {
				if (button.style === ButtonStyle.Link)
					postRow.addComponents(ButtonBuilder.from(button));

				if (button.style === ButtonStyle.Danger)
					dangerButtonBuilders.push(ButtonBuilder.from(button));
			}

			for (const buttonBuilder of dangerButtonBuilders) postRow.addComponents(buttonBuilder);

			userContainer.addActionRowComponents(postRow);

			return member
				.send({
					flags: MessageFlags.IsComponentsV2,
					components: [userContainer],
				})
				.catch(error);
		}),
	);
}

function getAttachmentURLFromPostMessage(message: Message<true>): string | undefined {
	if (!message.flags.has(MessageFlags.IsComponentsV2)) return;
	if (!message.components.length) return;

	const container = message.components[0];
	if (container.type !== ComponentType.Container) return;

	for (const component of container.components)
		if (component.type === ComponentType.MediaGallery && component.items.length)
			return component.items[0].media.url;
}

/**
 * @description
 * De naturaleza memética.
 * Comprueba si la búsqueda de tags de {@linkcode Booru} no es aprobada por Dios.
 */
function isUnholy(request: ComplexCommandRequest, terms: string[]): boolean {
	return (
		isNSFWChannel(request.channel)
		&& request.userId !== userIds.papita
		&& (terms.includes('holo') || terms.includes('megumin'))
	);
}

export interface CommandSearchOptions {
	cmdtag?: keyof typeof tagMaps;
	nsfwtitle?: string;
	sfwtitle?: string;
}

/**@description Busca las tags de {@linkcode Booru} deseadas y envía {@linkcode Message}s acorde a la petición.*/
export async function searchAndReplyWithPost(
	request: ComplexCommandRequest,
	args: CommandOptionSolver,
	options: CommandSearchOptions = {},
) {
	info('Se recibió una solicitud de respuesta con Posts resultados de búsqueda de Booru');

	const {
		cmdtag: commandTag = null,
		nsfwtitle: nsfwTitle = 'Búsqueda  NSFW',
		sfwtitle: sfwTitle = 'Búsqueda',
	} = options;

	const isNSFW = isNSFWChannel(request.channel);

	const clampPoolSize = (x: number) => Math.max(2, Math.min(x, 10));
	const poolSize = args.flagExprIf('bomba', (x) => clampPoolSize(x ? +x : 1), 1);
	const words = (args.getString('etiquetas', true) ?? '').split(/\s+/);

	debug('Verificando que la solicitud haya sido aprobada por el Vaticano');
	if (isUnholy(request, [commandTag ?? '', ...words])) {
		const rakki = await import('@/commands/instances/rakkidei');
		const rakkiCommand = (
			rakki instanceof Command ? rakki : rakki.default
		) as Command<undefined>;
		return rakkiCommand.execute(request);
	}

	debug('Comunicando retraso de respuesta a interacción...');
	await request.deferReply();

	debug('Se están por obtener tags de búsqueda a partir de la consulta del usuario');
	const baseTags = getBaseTags('gelbooru', isNSFW);
	const searchTags = [commandTag ?? '', baseTags].join(' ').trim();
	const userTags = getSearchTags(words, 'gelbooru', commandTag || 'general');
	const composedTags = [searchTags, userTags];
	const sortRegex = /\bsort:[^\s]+/gi;
	const finalTags = composedTags.some((t) => sortRegex.test(t))
		? composedTags
		: [...composedTags, 'sort:random'];
	debug('baseTags =', baseTags);
	debug('searchTags =', searchTags);
	debug('userTags =', userTags);
	debug('composedTags =', composedTags);
	debug('finalTags =', finalTags);

	const author = request.user;

	//Petición
	try {
		info('Buscando Posts...');
		const booru = getMainBooruClient();
		if (!booru)
			return request.editReply({
				content: (await Translator.fromUser(request)).getText('missingBooruCredentials'),
			});

		const posts = await booru.search(finalTags, { limit: +poolSize });

		//Manejo de respuesta
		if (!posts.length) {
			warn('La respuesta de búsqueda no tiene resultados');
			const replyOptions = {
				content: `⚠️ No hay resultados en **Gelbooru** para las tags **"${userTags}"** en canales **${isNSFW ? 'NSFW' : 'SFW'}**`,
			};
			return request.editReply(replyOptions) as Promise<Message<true>>;
		}

		debug('Se obtuvieron resultados de búsqueda válidos');

		debug('posts =');
		debug.dir(posts);

		//Crear presentaciones
		info('Preparando mensaje(s) de respuesta de búsqueda...');
		const postMessages = await Promise.all(
			posts.map((post, i) =>
				formatBooruPostMessage(booru, post, {
					maxGeneralTags: 20,
					title: isNSFW ? nsfwTitle : sfwTitle,
					manageableBy: author.id,
					allowNSFW: isNSFW,
					isNotFeed: true,
					componentKey: i,
				}),
			),
		);

		//Enviar mensajes
		info('Enviando mensaje(s) de respuesta de búsqueda...');
		const firstPostMessage = postMessages.shift() as {
			container: ContainerBuilder;
			attachment: AttachmentBuilder;
		};
		await request.editReply({
			flags: MessageFlags.IsComponentsV2,
			files: firstPostMessage.attachment ? [firstPostMessage.attachment] : undefined,
			components: [firstPostMessage.container],
		});
		return Promise.all(
			postMessages.map(({ container, attachment }) =>
				request.channel.send({
					flags: MessageFlags.IsComponentsV2,
					files: attachment ? [attachment] : undefined,
					components: [container],
				}),
			),
		).catch((err) => {
			error(
				err,
				'Ocurrió un problema al intentar enviar los resultados de búsqueda de Booru',
			);
			return [] as Message<true>[];
		});
	} catch (err) {
		error(err, 'Ocurrió un problema al procesar una petición de búsqueda de Booru');
		const errorEmbed = new EmbedBuilder().setColor(Colors.Red).addFields({
			name: 'Ocurrió un error al realizar una petición',
			value: [
				'Es probable que le hayan pegado un tiro al que me suministra las imágenes, así que prueba buscar más tarde, a ver si revive 👉👈',
				'```js',
				`${[err.name, err.message].join(': ')}\n`,
				'```',
			].join('\n'),
		});

		return request.editReply({ embeds: [errorEmbed] }) as Promise<Message<true>>;
	}
}

interface PostAttachmentRecord {
	builder: AttachmentBuilder;
	validUntil: Date;
}

const postAttachmentTTLMinutes = 31;
const postAttachments = new Map<string, PostAttachmentRecord>();

export function cleanPostAttachmentRecords() {
	for (const [key, record] of postAttachments.entries())
		if (isPast(record.validUntil)) postAttachments.delete(key);
}

async function getPostAttachment(
	post: Post,
	attachmentName: 'previewUrl' | 'fileUrl' | 'sampleUrl',
): Promise<AttachmentBuilder | null> {
	const url = post[attachmentName];
	if (!url) return null;

	const postAttachmentRecord = postAttachments.get(`${url}`);

	if (postAttachmentRecord == null || isPast(postAttachmentRecord.validUntil)) {
		const record = await fetchAndSavePostAttachment(post.id, url);
		return record?.builder ?? null;
	}

	return postAttachmentRecord.builder;
}

async function fetchAndSavePostAttachment(
	postId: string,
	url: string | URL,
): Promise<PostAttachmentRecord | null> {
	const fetchRes = await fetchExt(url, {
		type: 'buffer',
		init: {
			headers: {
				'Access-Control-Allow-Origin': '*',
				Referer: 'https://gelbooru.com/',
			},
		},
	});

	if (!fetchRes.success) return null;

	const record: PostAttachmentRecord = {
		builder: new AttachmentBuilder(fetchRes.data, { name: `bdp_thumb_${postId}.webp` }),
		validUntil: addMinutes(new Date(), postAttachmentTTLMinutes),
	};

	postAttachments.set(`${url}`, record);
	return record;
}

export function formatTagName(tagName: string) {
	if (tagName === '(...)') return '…';
	if (!tagName.includes('`')) return `\`${tagName}\``;
	return `\`\`${tagName.replace(/`$/g, '` ')}\`\``;
}

export function formatTagNameList(tagNames: string[], sep: string) {
	return tagNames.map(formatTagName).join(sep);
}

export function getPostButtonsFromComponents(topLevelComponents: TopLevelComponent[]) {
	const container = topLevelComponents.find((c) => c.type === ComponentType.Container);

	if (!container) return undefined;

	return container.components.find(
		(c) => c.type === ComponentType.ActionRow && c.components[0].type === ComponentType.Button,
	) as ActionRow<ButtonComponent>;
}

export function getPostUrlFromComponents(topLevelComponents: TopLevelComponent[]) {
	const containerButtonRow = getPostButtonsFromComponents(topLevelComponents);
	if (!containerButtonRow) return undefined;
	return containerButtonRow.components[0].url;
}
