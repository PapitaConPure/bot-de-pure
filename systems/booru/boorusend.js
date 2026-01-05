const { makeButtonRowBuilder } = require('../../utils/tsCasts');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, MessageFlags, SeparatorSpacingSize } = require('discord.js');
const { guildEmoji: gEmo, shortenText, isThread } = require('../../func');
const { Booru, TagTypes } = require('./boorufetch');
const { getBaseTags, getSearchTags } = require('./booruprops');
const globalConfigs = require('../../data/config.json');
const rakki = require('../../commands/Instances/rakkidei');
const { Translator } = require('../../i18n/internationalization');

const Logger = require('../../utils/logs');
const { debug, info, warn, error } = Logger('WARN', 'BooruSend');

/**
 * @typedef {Object} PostFormatData
 * @property {number} [maxTags]
 * @property {string} [title]
 * @property {string} [subtitle]
 * @property {string} [footer]
 * @property {string} [cornerIcon]
 * @property {string} [manageableBy]
 * @property {boolean} [allowNSFW]
 * @property {boolean} [isNotFeed]
 * @property {boolean} [disableLinks]
 * @property {boolean} [disableActions]
 * 
 * @typedef {{ emoji: string, color: number }} SourceStyle
 */

/**
 * Algunos enlaces pueden pertenecer a dominios asociados de un sitio para alojar recursos. Cosas como enlaces de CDNs.
 * Estos enlaces generalmente expiran y no tienen un patrón reconocible para darles estilo, por lo que deben ser convertidos a enlaces de las publicaciones que contienen el recurso.
 * Aquellos con conversiones conocidas aparecen en este mapeado para recuperar el enlace de publicación al que están asociados
 * @type {ReadonlyArray<{ pattern: RegExp, replacement: string }>}
 */
const sourceMappings = [
	{
		pattern: /https:\/\/i.pximg.net\/img-original\/img\/[0-9/]{19}\/([0-9]+)_p[0-9]+\.[A-Za-z]{2,4}/,
		replacement: 'https://www.pixiv.net/artworks/$1',
	},
	{
		pattern: /https:\/\/booth\.pximg\.net\/[0-9a-z]+(?:-[0-9a-z]+){4}\/i\/([0-9]+)\/[0-9a-z]+(?:-[0-9a-z]+){4}(?:[a-z_]+)?\.[a-z0-9]{2,4}/,
		replacement: 'https://booth.pm/en/items/$1',
	},
];

/**@type {ReadonlyArray<SourceStyle & { pattern: RegExp }>}*/
const SOURCE_STYLES = [
	{ color: 0x0096fa, emoji: '1334816111270563880', pattern: /pixiv\.net(?!\/fanbox)/ },
	{ color: 0x040404, emoji: '1232243415165440040', pattern: /(twitter|twimg|x)\.com/ },
	{ color: 0xfaf18a, emoji: '999783444655648869' , pattern: /pixiv\.net\/fanbox|fanbox\.cc/ },
	{ color: 0xea4c89, emoji: '1000265840182181899', pattern: /fantia\.jp/ },
	{ color: 0x28837f, emoji: '1001397393511682109', pattern: /skeb\.jp/ },
	{ color: 0x0085ff, emoji: '1298259199477678115', pattern: /bsky\.app/ },
	{ color: 0x00e59b, emoji: '1299754762115219681', pattern: /deviantart\.com/ },
	{ color: 0x009c94, emoji: '1297689776941568073', pattern: /lofter\.com/ },
	{ color: 0x23aee5, emoji: '1297697987014824066', pattern: /t\.bilibili\.com/ },
	{ color: 0x020814, emoji: '1298264258991095850', pattern: /cara\.app/ },
	{ color: 0x36465d, emoji: '969666470252511232' , pattern: /tumblr\.com/ },
	{ color: 0x252525, emoji: '1334123400024817724', pattern: /seiga\.nicovideo\.jp/ },
	{ color: 0x0b69b7, emoji: '1334123419733721153', pattern: /www\.patreon\.com/ },
	{ color: 0xfcbd00, emoji: '1298305816247664640', pattern: /drive\.google\.com/ },
	{ color: 0xff4500, emoji: '969666029045317762' , pattern: /(reddit\.com)|(([iv]\.)?redd\.it)/ },
	{ color: 0xff9a30, emoji: '1299753011932827749', pattern: /weibo\.com/ },
	{ color: 0xff6c60, emoji: '919403803114094682' , pattern: /nitter\.net/ },
	{ color: 0xff5c67, emoji: '1298674477470716106', pattern: /booth\.pm/ },
	{ color: 0xff0000, emoji: '1298671334246715453', pattern: /youtube\.com/ },
	{ color: 0xfda238, emoji: '1334813506599649311', pattern: /www\.newgrounds\.com/ },
	{ color: 0x1e2327, emoji: '1303457942468690050', pattern: /github\.com/ },
	{ color: 0x252525, emoji: '1334123400024817724', pattern: /www\.nicovideo\.jp/ },
];

/**@type {SourceStyle}*/
const noSource = { color: Colors.Aqua, emoji: undefined };

/**@type {SourceStyle}*/
const unknownSource = { color: 0x1bb76e, emoji: '969664712604262400' };

/**@type {{ [K: string]: { order: number, emote: string } }}*/
const resMappings = /**@type {const}*/({
	'lowres'               : { order: 0, emote: '<:lowRes:1355765055945310238>' },
	'highres'              : { order: 1, emote: '<:highRes:1355765065772699719>' },
	'absurdres'            : { order: 2, emote: '<:absurdRes:1355765080800890891>' },
	'incredibly_absurdres' : { order: 3, emote: '<:incrediblyAbsurdRes:1355765110387507374>' },
});

/**@type {{ [K: string]: string }}*/
const sexEmotes = /**@type {const}*/({
	girl : '<:girl:1355803255481045053>',
	boy  : '<:boy:1355803803248623646>',
	futa : '<:futa:1355803817089831055>',
});

const ignoredTagsIfSexCount = new Set([
	'multiple_girls',
	'multiple_boys',
	'multiple_futa',
]);

/**
 * Genera un {@linkcode EmbedBuilder} a base de un {@linkcode Post} de {@linkcode Booru}
 * @param {Booru} booru Instancia de Booru
 * @param {import('./boorufetch').Post} post Post de Booru
 * @param {PostFormatData} data Información adicional a mostrar en el Embed. Se puede pasar un Feed directamente
 * @returns {Promise<import('discord.js').ContainerBuilder>}
 */
async function formatBooruPostMessage(booru, post, data = {}) {
	info('Se recibió una solicitud de formato de mensaje con Post de Booru');

	const {
		allowNSFW = false,
		disableLinks = false,
		disableActions = false,
	} = data;

	//Botón de Post de Gelbooru
	const buttonRow = makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
		.setEmoji('919398540172750878')
		.setStyle(ButtonStyle.Link)
		.setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`)
		.setDisabled(disableLinks),
	);
	
	//Botón de Fuente (si está disponible)
	let containerColor = null;
	const addSourceButtonAndApplyStyle = (/**@type {String}*/ source) => {
		sourceMappings.forEach(mapping => {
			source = source.replace(mapping.pattern, mapping.replacement);
		});

		//Dar estilo a Embed según fuente de la imagen
		const sourceStyle = SOURCE_STYLES.find(s => s.pattern.test(source)) ?? unknownSource;
		const emoji = sourceStyle.emoji;
		containerColor ??= sourceStyle.color;

		if(source.length > 512) {
			warn('El texto de una fuente del Post sobrepasa los 512 caracteres');
			return buttonRow.addComponents(
				new ButtonBuilder()
					.setEmoji(emoji)
					.setStyle(ButtonStyle.Danger)
					.setCustomId('feed_invalidUrl')
					.setDisabled(true),
			);
		}

		buttonRow.addComponents(
			new ButtonBuilder()
				.setEmoji(emoji)
				.setStyle(ButtonStyle.Link)
				.setURL(source)
				.setDisabled(disableLinks),
		);
	};

	//Aplicar estilo y botones de source
	debug('Se está por decidir el estilo del Embed del mensaje');
	if(post.source) {
		debug('El Post tiene fuentes. Se buscarán enlaces');
		const sourceUrl = post.findFirstUrlSource();

		if(sourceUrl) {
			debug('El Post tiene enlaces como fuentes. Se aplicará un botón de enlace a fuente y el estilo de la fuente primaria');
			addSourceButtonAndApplyStyle(sourceUrl);
		} else {
			debug('El Post no tiene enlaces como fuentes. Se aplicará un botón de texto plano');
			buttonRow.addComponents(
				new ButtonBuilder()
					.setCustomId('feed_plainText')
					.setStyle(ButtonStyle.Secondary)
					.setLabel(shortenText(post.source, 72))
					.setDisabled(true),
			);
		}
	}
	containerColor ??= noSource.color;
	
	//Filtrar tags con estilos especiales
	debug('A punto de procesar tags especiales');
	const originalPostTags = [ ...post.tags ];
	let maxResOrder = -1;
	let resTag = '';
	const sexTags = /**@type {Array<String>}*/([]);
	let hasTagMe = false;
	let hasRequestTags = false;
	post.tags = post.tags.filter(t => {
		if(t === 'tagme') {
			hasTagMe = true;
			return false;
		}

		if(t.endsWith('_request')) {
			//"commentary_request" suele venir de Danbooru y el contexto de artista se ignora en Gelbooru
			hasRequestTags = (t !== 'commentary_request');
			return false;
		}

		const resMapping = resMappings[t];
		if(resMapping) {
			const { order: resOrder, emote: resEmote } = resMapping;
			if(resOrder > maxResOrder) {
				resTag = resEmote;
				maxResOrder = resOrder;
			}
			return false;
		}

		const sexTag = t.match(/([0-9]\+?)(girl|boy|futa)s?/);
		if(sexTag) {
			sexTags.push(`${sexEmotes[sexTag[2]]}${sexTag[1]}`);
			return false;
		}

		return true;
	});

	debug('resTag =', resTag);
	debug('sexTags =', sexTags);

	if(sexTags.length)
		post.tags = post.tags.filter(t => !ignoredTagsIfSexCount.has(t));

	const specialTags = [
		...sexTags,
		...(resTag ? [resTag] : []),
	];

	debug('specialTags =', specialTags);
	debug('postTags =', post.tags);

	debug('Aplicando botones adicionales...');
	
	//Botón de tags
	buttonRow.addComponents(
		new ButtonBuilder()
			.setEmoji('921788204540100608')
			.setStyle(ButtonStyle.Primary)
			.setCustomId(`feed_showFeedImageTags_${data.isNotFeed ? 'NaF' : ''}`)
			.setDisabled(disableActions),
	);

	//Botón de contribución
	if(hasTagMe || hasRequestTags)
		buttonRow.addComponents(
			new ButtonBuilder()
				.setEmoji('1355496081550606486')
				.setStyle(ButtonStyle.Success)
				.setCustomId(`feed_contribute`)
				.setDisabled(disableActions),
		);
	
	//Botón de eliminación
	buttonRow.addComponents(
		new ButtonBuilder()
			.setEmoji('1355143793577426962')
			.setStyle(ButtonStyle.Danger)
			.setCustomId(`feed_deletePost_${data.manageableBy ?? ''}_${data.isNotFeed ?? ''}`)
			.setDisabled(disableActions),
	);

	//Preparar contenedor final
	info('Se comenzará a preparar el contenedor final del Post');
	const container = new ContainerBuilder()
		.setAccentColor(containerColor);
	
	//Título
	if(data.title)
		container.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(`## ${data.title}`)
		);

	//Previsualización
	debug('Comprobando bloqueo de contenido explícito de Post según el canal del mensaje');
	const shouldBlock = (post.rating === 'explicit' || post.rating === 'questionable') && !allowNSFW;
	
	if(!shouldBlock) {
		let previewUrl;
		debug('El contenido no fue bloqueado. Se agregará al mensaje a continuación');
		if(/\.(mp4|webm|webp)/.test(post.fileUrl)) {
			debug('El contenido es un video');
			previewUrl = post.fileUrl || post.previewUrl || post.sampleUrl;
		} else if(/\.gif/.test(post.fileUrl)) {
			debug('El contenido es un GIF');
			previewUrl = post.fileUrl || post.previewUrl || post.sampleUrl;
		} else {
			debug('El contenido es probablemente una imagen estática');
			previewUrl = post.sampleUrl || post.fileUrl || post.previewUrl;
		}
		container.addMediaGalleryComponents(mediaGallery =>
			mediaGallery.addItems(mediaGalleryItem => 
				mediaGalleryItem.setURL(previewUrl)
			)
		);
	}
		
	//Tags
	debug('A punto de intentar procesar las tags del Post');
	const maxTags = data.maxTags ?? 20;
	const actualMaxTags = Math.max(0, maxTags - specialTags.length);
	const actualTotalTags = post.tags.length + specialTags.length;
	try {
		let thumbnailUrl = null;
		debug('Obteniendo información adicional de tags...');
		const postTags = await booru.fetchPostTags(post);

		//Advertencia de IA
		debug('Se determinará la miniatura del Embed del mensaje');
		const aiGeneratedTagIndex = postTags.findIndex(t => [ 'ai-generated', 'ai-assisted' ].includes(t.name));
		if(aiGeneratedTagIndex >= 0) {
			postTags.splice(aiGeneratedTagIndex, 1);
			thumbnailUrl = 'https://i.imgur.com/1Q41hhC.png';
		}

		debug('A punto de distribuir las etiquetas en categorías');
		const postArtistTags    = /**@type {Array<String>}*/([]);
		const postCharacterTags = /**@type {Array<String>}*/([]);
		const postCopyrightTags = /**@type {Array<String>}*/([]);
		const postOtherTags     = /**@type {Array<String>}*/([]);

		postTags.forEach(tag => {
			const { name } = tag;

			switch(tag.type) {
			case TagTypes.ARTIST:
				return postArtistTags.push(name);
			case TagTypes.CHARACTER:
				return postCharacterTags.push(name);
			case TagTypes.COPYRIGHT:
				return postCopyrightTags.push(name);
			default:
				return postOtherTags.push(name);
			}
		});

		debug('artistas =', postArtistTags);
		debug('personajes =', postCharacterTags);
		debug('copyright =', postCopyrightTags);
		debug('restantes =', postOtherTags);

		const s3 = globalConfigs.slots.slot3;
		const otherTags = postOtherTags.slice(0, actualMaxTags);
		const displayedTagsCount = Math.min(otherTags.length + specialTags.length, maxTags);
		const generalTagsTitle = `${gEmo('tagswhite', s3)} (${displayedTagsCount}/${actualTotalTags})`;
		const generalTagsContent = `${specialTags.join(' ')} ${formatTagNameListNew(otherTags, ' ')}`.trim();
		const postGeneralTags = shortenText(`-# ${generalTagsTitle} ${generalTagsContent}`, 1020);

		const getCategoryFieldString = (/**@type {String}*/ fieldName, /**@type {Array<String>}*/arr) => {
			if(!arr.length) return;

			const totalCount = arr.length;
			let partialCount = arr.length;
			if(arr.length > 4) {
				arr = arr
					.with(3, '(...)')
					.slice(0, 4);
				partialCount = 3;
			}

			let content = formatTagNameListNew(arr, ' ');
			if(!content.length) return;
			
			const infoSuffix = partialCount < totalCount ? ` (${partialCount}/${totalCount})` : '';
			
			return `${fieldName.trim()}${infoSuffix} ${shortenText(content.trim(), 320)}`;
		}
		
		debug('A punto de formular etiquetas en el Embed del mensaje');
		if(postArtistTags.length + postCharacterTags.length + postCopyrightTags.length > 0)
		container.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent([
				maxTags > 0 ? '###' : '',
				getCategoryFieldString('<:palette:1355128249658638488>', postArtistTags),
				getCategoryFieldString('<:person:1355128242993893539>', postCharacterTags),
				getCategoryFieldString('<:landmark:1355128256432443584>', postCopyrightTags),
			].join(' ').trim())
		);

		debug('Comprobando si se debe insertar un campo de tags sin categoría');
		debug('displayedTagsCount =', displayedTagsCount);
		if(displayedTagsCount > 0) {
			debug('A punto de insertar un campo de tags sin categoría');

			if(thumbnailUrl) {
				container.addSectionComponents(section =>
					section
						.addTextDisplayComponents(textDisplay =>
							textDisplay.setContent(postGeneralTags)
						)
						.setThumbnailAccessory(accessory =>
							accessory.setURL(thumbnailUrl)
						)
				)
			} else {
				container.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent(postGeneralTags)
				)
			}
		}
	} catch(err) {
		error(err, 'Ocurrió un problema al procesar y formatear las tags de un Post de Booru para un mensaje');
		info('Intentando formatear tags con método alternativo sin categorías');

		const postTags = post.tags;
		const filteredTags = postTags.slice(0, actualMaxTags);
		const displayedTagsCount = Math.min(filteredTags.length + specialTags.length, maxTags);

		debug('Comprobando si se debe insertar un campo de tags');
		debug('displayedTagsCount =', displayedTagsCount);
		if(displayedTagsCount > 0) {
			debug('A punto de insertar un campo de tags');
			const generalTagsTitle = `${gEmo('tagswhite', globalConfigs.slots.slot3)} (${displayedTagsCount}/${actualTotalTags})`;
			const generalTagsContent = `${specialTags.join(' ')} ${formatTagNameListNew(filteredTags, ' ')}`.trim();
			const postGeneralTags = shortenText(`-# ${generalTagsTitle} ${generalTagsContent}`, 1020);
			container.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(postGeneralTags)
			);
		}
	}

	post.tags = originalPostTags;
	
	info('Agregando botones');
	container
		.addSeparatorComponents(separator =>
			separator
				.setDivider(true)
				.setSpacing(maxTags > 0 ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small)
		)
		.addActionRowComponents(buttonRow);

	info('Se terminó de formatear un contenedor a de acuerdo a un Post de Booru');
	
	return container;
};

/**
 * Envía una notificación de {@linkcode Post} de {@linkcode Booru} a todos los {@linkcode User} suscriptos a las tags del mismo
 * @typedef {{ userId: import('discord.js').Snowflake, followedTags: Array<String> }} Suscription
 * @param {import('./boorufetch').Post} post
 * @param {import('discord.js').Message<true>} sent
 * @param {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').GuildMember>} members
 * @param {Array<Suscription>} feedSuscriptions 
 */
async function notifyUsers(post, sent, members, feedSuscriptions) {
	info('Se recibió una orden para notificar sobre un nuevo Post a usuarios suscriptos aplicables');

	//No sé qué habré estado pensando cuando escribí esto, pero no pienso volver a tocarlo
	
	if(!sent)
		throw 'Se esperaba un mensaje para el cuál notificar';

	const container = /**@type {import('discord.js').ContainerComponent}*/(sent.components?.[0]);
	if(!container)
		throw 'Se esperaba un mensaje de Feed válido';

	const channel = sent.channel;
	if(!channel)
		throw 'No se encontró un canal para el mensaje enviado';

	const matchingSuscriptions = feedSuscriptions.filter(suscription => suscription.followedTags.some(tag => post.tags.includes(tag)));
	if(!matchingSuscriptions.length) {
		info('No se encontraron suscripciones aplicables para el Post procesado');
		return [];
	}

	info('Se encontraron suscripciones aplicables, intentando enviar notificaciones...');
	const containerSize = container.components.length;
	const containerButtonRow = /**@type {import('discord.js').ActionRow<import('discord.js').ButtonComponent>}*/(container.components[containerSize - 1]);

	debug('Intentando enviar notificaciones...');
	return Promise.all(matchingSuscriptions.map(async ({ userId, followedTags }) => {
		const member = members.get(userId);
		if(!channel || !member)
			return Promise.resolve(null);

		const translator = await Translator.from(member);
		const matchingTags = followedTags.filter(tag => post.tags.includes(tag));

		const userEmbed = new EmbedBuilder()
			.setColor(container.accentColor ?? 0x0)
			.setTitle(translator.getText('booruNotifTitle'))
			.setDescription(translator.getText('booruNotifDescription'))
			.setFooter({ text: translator.getText('dmDisclaimer') })
			.setThumbnail(post.previewUrl)
			.addFields(
				{
					name: 'Feed',
					value: `${channel}`,
					inline: true,
				},
				{
					name: translator.getText('booruNotifTagsName'),
					value: `\`\`\`\n${matchingTags.join(' ')}\n\`\`\``,
					inline: true,
				},
			);
		
		const postRow = makeButtonRowBuilder(containerButtonRow);
		const spliceIndex = postRow.components.findLastIndex(component => component.data.style === ButtonStyle.Link);
		postRow.components.splice(spliceIndex + 1);
		postRow.addComponents(
			new ButtonBuilder()
				.setURL(sent.url)
				.setEmoji('1087075525245272104')
				.setStyle(ButtonStyle.Link),
		);

		return member.send({
			embeds: [userEmbed],
			components: [postRow],
		}).catch(error);
	}));
}

/**
 * De naturaleza memética.
 * Comprueba si la búsqueda de tags de {@linkcode Booru} no es aprobada por Dios
 * @param {Boolean} isNsfw 
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest} request 
 * @param {Array<String>} terms 
 * @returns {Boolean}
 */
function isUnholy(isNsfw, request, terms) {
	return isNsfw
		&& (request.userId !== globalConfigs.peopleid.papita)
		&& (terms.includes('holo') || terms.includes('megumin'));
}

/**
 * @typedef {Object} CommandSearchOptions
 * @property {keyof import('./booruprops')['tagMaps']} [cmdtag] 
 * @property {string} [nsfwtitle] 
 * @property {string} [sfwtitle] 
 */
/**
 * Busca las tags de {@linkcode Booru} deseadas y envía {@linkcode Message}s acorde a la petición
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest} request
 * @param {import('../../commands/Commons/cmdOpts').CommandOptionSolver} args
 * @param {CommandSearchOptions} [options]
 */
async function searchAndReplyWithPost(request, args, options = {}) {
	info('Se recibió una solicitud de respuesta con Posts resultados de búsqueda de Booru');

	const {
		cmdtag: commandTag = null,
		nsfwtitle: nsfwTitle = 'Búsqueda  NSFW',
		sfwtitle: sfwTitle = 'Búsqueda',
	} = options;

	const isnsfw = isThread(request.channel)
		? request.channel.parent.nsfw
		: request.channel.nsfw;
	
	const poolSize = args.parseFlagExpr('bomba', x => Math.max(2, Math.min(+x, 10)), 1);
	const words = (args.getString('etiquetas', true) ?? '').split(/\s+/);
	debug('poolSize =', poolSize);

	debug('Verificando que la solicitud haya sido aprobada por el Vaticano');
	if(isUnholy(isnsfw, request, [ commandTag, ...words ]))
		return rakki.execute(request, args);

	debug('Comunicando retraso de respuesta a interacción...');
	await request.deferReply();

	debug('Se están por obtener tags de búsqueda a partir de la consulta del usuario');
	const baseTags = getBaseTags('gelbooru', isnsfw);
	const searchTags = [ commandTag ?? '', baseTags ].join(' ').trim();
	const userTags = getSearchTags(words, 'gelbooru', commandTag || 'general');
	const finalTags = [ searchTags, userTags ];
	debug('baseTags =', baseTags);
	debug('searchTags =', searchTags);
	debug('userTags =', userTags);
	debug('finalTags =', finalTags);
	
	/**@type {import('discord.js').User} */
	const author = request.user;
	
	//Petición
	try {
		info('Buscando Posts...');
		const booru = new Booru(globalConfigs.booruCredentials);
		const response = await booru.search(finalTags, { limit: 100, random: true });

		//Manejo de respuesta
		if(!response.length) {
			warn('La respuesta de búsqueda no tiene resultados');
			const replyOptions = { content: `⚠️ No hay resultados en **Gelbooru** para las tags **"${userTags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` };
			return /**@type {Promise<import('discord.js').Message<true>>}*/(request.editReply(replyOptions));
		}

		debug('Se obtuvieron resultados de búsqueda válidos');

		//Seleccionar imágenes
		const posts = response
			.sort(() => 0.5 - Math.random())
			.slice(0, poolSize);

		debug('posts =', posts);

		//Crear presentaciones
		info('Preparando mensaje(s) de respuesta de búsqueda...');
		const containers = await Promise.all(posts.map(post => formatBooruPostMessage(booru, post, {
			maxTags: 20,
			title: isnsfw ? nsfwTitle : sfwTitle,
			manageableBy: author.id,
			allowNSFW: isnsfw,
			isNotFeed: true,
		})));

		//Enviar mensajes
		info('Enviando mensaje(s) de respuesta de búsqueda...');
		const firstContainer = containers.shift();
		await request.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [firstContainer],
		});
		return Promise.all(
			containers.map(container =>
				request.channel.send({
					flags: MessageFlags.IsComponentsV2,
					components: [container],
				})
			)
		).catch(err => {
			error(err, 'Ocurrió un problema al intentar enviar los resultados de búsqueda de Booru');
			return /**@type {Array<import('discord.js').Message<true>>}*/([]);
		});
	} catch(err) {
		error(err, 'Ocurrió un problema al procesar una petición de búsqueda de Booru');
		const errorEmbed = new EmbedBuilder()
			.setColor(Colors.Red)
			.addFields({
				name: 'Ocurrió un error al realizar una petición',
				value: [
					'Es probable que le hayan pegado un tiro al que me suministra las imágenes, así que prueba buscar más tarde, a ver si revive 👉👈',
					'```js',
					`${[err.name, err.message].join(': ')}\n`,
					'```',
				].join('\n'),
			});
			
		return /**@type {Promise<import('discord.js').Message<true>>}*/(request.editReply({ embeds: [errorEmbed] }));
	}
};

/**@param {String} tag*/
function formatTagName(tag) {
	return tag
		.replace(/\\/g, '\\\\')
		.replace(/\*/g, '\\*')
		.replace(/_/g,  '\\_')
		.replace(/\|/g, '\\|');
}

/**@param {String} tag*/
function formatTagNameNew(tag) {
	if(!tag.includes('`'))
		return `\`${tag}\``;

	return `\`\`${tag.replace(/`$/g, '` ')}\`\``;
}

/**
 * @param {Array<String>} tagNames
 * @param {String} sep
 * @param {{ leftStr?: String, rightStr?: String }} options
 */
function formatTagNameList(tagNames, sep, options = {}) {
	const { leftStr = '', rightStr = '' } = options;
	return tagNames
		.map(tagName => `${leftStr}${formatTagName(tagName)}${rightStr}`)
		.join(sep);
}

/**
 * @param {Array<String>} tagNames
 * @param {String} sep
 */
function formatTagNameListNew(tagNames, sep) {
	return tagNames
		.map(tagName => tagName === '(...)' ? '…' : formatTagNameNew(tagName))
		.join(sep);
}

/**@param {import('discord.js').ContainerComponent} container*/
function getPostUrlFromContainer(container) {
	const containerSize = container.components.length;
	const containerButtonRow = /**@type {import('discord.js').ActionRow<import('discord.js').ButtonComponent>}*/(container.components[containerSize - 1]);
	return containerButtonRow.components[0].url;
}

module.exports = {
	SOURCE_STYLES,
	formatBooruPostMessage,
	notifyUsers,
	searchAndReplyWithPost,
	formatTagName,
	formatTagNameList,
	formatTagNameNew,
	formatTagNameListNew,
	getPostUrlFromContainer,
};
