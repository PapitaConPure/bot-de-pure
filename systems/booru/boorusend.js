const { makeButtonRowBuilder } = require('../../tsCasts');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, Colors, Message, User, ActionRowBuilder, ChatInputCommandInteraction, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const { CommandOptions } = require('../../commands/Commons/cmdOpts');
const { guildEmoji: gEmo, shortenText, isThread } = require('../../func');
const { Post, Booru, TagTypes } = require('./boorufetch');
const { getBaseTags, getSearchTags, tagMaps } = require('../../localdata/booruprops');
const globalConfigs = require('../../localdata/config.json');
const rakki = require('../../commands/Pure/rakkidei');
const { Translator } = require('../../internationalization');

const Logger = require('../../logs');
const { debug, info, warn, error, fatal } = Logger('WARN', 'BooruSend');

/**
 * @typedef {{ maxTags?: number, title?: string, subtitle?: string, footer?: string, cornerIcon?: string, manageableBy?: string, allowNSFW?: boolean, isNotFeed?: boolean }} PostFormatData
 * @typedef {{ emoji: string, color: import('discord.js').ColorResolvable }} SourceStyle
 * @typedef {{ embeds: Array<EmbedBuilder>, components: Array<ActionRowBuilder<ButtonBuilder>> }} PostMessageOptions
 */

/**
 * Algunos enlaces pueden pertenecer a dominios asociados de un sitio para alojar recursos. Cosas como enlaces de CDNs.
 * Estos enlaces generalmente expiran y no tienen un patrón reconocible para darles estilo, por lo que deben ser convertidos a enlaces de las publicaciones que contienen el recurso.
 * Aquellos con conversiones conocidas aparecen en este mapeado para recuperar el enlace de publicación al que están asociados
 * @type {ReadonlyArray<{ pattern: RegExp, replacement: string }>}
 */
const sourceMappings = [
	{
		pattern: /https:\/\/i.pximg.net\/img-original\/img\/[0-9\/]{19}\/([0-9]+)_p[0-9]+\.[A-Za-z]{2,4}/,
		replacement: 'https://www.pixiv.net/artworks/$1',
	},
	{
		pattern: /https:\/\/booth\.pximg\.net\/[0-9a-z]+(?:-[0-9a-z]+){4}\/i\/([0-9]+)\/[0-9a-z]+(?:-[0-9a-z]+){4}(?:[a-z_]+)?\.[a-z0-9]{2,4}/,
		replacement: 'https://booth.pm/en/items/$1',
	},
];

/**@type {ReadonlyArray<SourceStyle & { pattern: RegExp }>}*/
const SOURCE_STYLES = [
	{ color: 0x0096fa, emoji: '1334816111270563880' , pattern: /pixiv\.net(?!\/fanbox)/ },
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
	{ color: 0x0b69b7, emoji: '1334123419733721153', pattern: /www.patreon.com/ },
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
	'lowres'               : { order: 0, emote: '<:lowres:1355765055945310238>' },
	'highres'              : { order: 1, emote: '<:highres:1355765065772699719>' },
	'absurdres'            : { order: 2, emote: '<:absurdres:1355765080800890891>' },
	'incredibly_absurdres' : { order: 3, emote: '<:incrediblyAbsurdres:1355765110387507374>' },
});

/**@type {{ [K: string]: string }}*/
const sexEmotes = /**@type {const}*/({
	girl : '<:girl:1355803255481045053>',
	boy  : '<:boy:1355803803248623646>',
	futa : '<:futa:1355803817089831055>',
});

const disallowedTagsIfSexCount = new Set([
	'multiple_girls',
	'multiple_boys',
	'multiple_futa',
]);

/**
 * Genera un {@linkcode EmbedBuilder} a base de un {@linkcode Post} de {@linkcode Booru}
 * @param {Booru} booru Instancia de Booru
 * @param {Post} post Post de Booru
 * @param {PostFormatData} data Información adicional a mostrar en el Embed. Se puede pasar un Feed directamente
 * @returns {Promise<PostMessageOptions>}
 */
async function formatBooruPostMessage(booru, post, data = {}) {
	info('Se recibió una solicitud de formato de mensaje con Post de Booru');

	//Botón de Post de Gelbooru
	const row = makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setEmoji('919398540172750878')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`),
	);
	/**@type {import('discord.js').ColorResolvable}*/
	let embedColor;

	//Botón de Fuente (si está disponible)
	const addSourceButtonAndApplyStyle = (/**@type {String}*/ source) => {
		sourceMappings.forEach(mapping => {
			source = source.replace(mapping.pattern, mapping.replacement);
		});

		//Dar estilo a Embed según fuente de la imagen
		const sourceStyle = SOURCE_STYLES.find(s => s.pattern.test(source)) ?? unknownSource;
		const emoji = sourceStyle.emoji;
		embedColor ??= sourceStyle.color;

		if(source.length > 512) {
			warn('El texto de una fuente del Post sobrepasa los 512 caracteres');
			return row.addComponents(
				new ButtonBuilder()
					.setEmoji(emoji)
					.setStyle(ButtonStyle.Danger)
					.setCustomId('feed_invalidUrl')
					.setDisabled(true),
			);
		}

		row.addComponents(
			new ButtonBuilder()
				.setEmoji(emoji)
				.setStyle(ButtonStyle.Link)
				.setURL(source),
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
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('feed_plainText')
					.setStyle(ButtonStyle.Secondary)
					.setLabel(shortenText(post.source, 72))
					.setDisabled(true),
			);
		}
	}
	embedColor ??= noSource.color;
	
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
		post.tags = post.tags.filter(t => !disallowedTagsIfSexCount.has(t));

	const specialTags = [
		...sexTags,
		...(resTag ? [resTag] : []),
	];

	debug('specialTags =', specialTags);
	debug('postTags =', post.tags);

	debug('Aplicando botones adicionales...');
	
	//Botón de tags
	row.addComponents(
		new ButtonBuilder()
			.setEmoji('921788204540100608')
			.setStyle(ButtonStyle.Primary)
			.setCustomId(`feed_showFeedImageTags_${data.isNotFeed ? 'NaF' : ''}`),
	);

	//Botón de contribución
	if(hasTagMe || hasRequestTags)
		row.addComponents(
			new ButtonBuilder()
				.setEmoji('1355496081550606486')
				.setStyle(ButtonStyle.Success)
				.setCustomId(`feed_contribute`),
		);
	
	//Botón de eliminación
	row.addComponents(
		new ButtonBuilder()
			.setEmoji('1355143793577426962')
			.setStyle(ButtonStyle.Danger)
			.setCustomId(`feed_deletePost_${data.manageableBy ?? ''}_${data.isNotFeed ?? ''}`),
	);

	//Preparar Embed final
	info('Se comenzará a preparar el Embed final del Post');
	const postEmbed = new EmbedBuilder()
		.setColor(embedColor);
	
	/**@type {PostMessageOptions} */
	const postMessageData = {
		components: [row],
		embeds: [postEmbed],
	};
	
	//Subtítulo e ícono
	if(data.cornerIcon)
		postEmbed.setAuthor({
			name: data.subtitle || 'Gelbooru',
			iconURL: data.cornerIcon,
		});
	else if(data.subtitle)
		postEmbed.setAuthor({ name: data.subtitle });

	//Tags
	debug('A punto de intentar procesar las tags del Post');
	const maxTags = data.maxTags ?? 20;
	const actualMaxTags = Math.max(0, maxTags - specialTags.length);
	const actualTotalTags = post.tags.length + specialTags.length;
	try {
		debug('Obteniendo información adicional de tags...');
		const postTags = await booru.fetchPostTags(post);
		debug('fetchedPostTags =', postTags);

		//Advertencia de IA
		debug('Se determinará la miniatura del Embed del mensaje');
		const aiGeneratedTagIndex = postTags.findIndex(t => [ 'ai-generated', 'ai-assisted' ].includes(t.name));
		if(aiGeneratedTagIndex >= 0) {
			postTags.splice(aiGeneratedTagIndex, 1);
			postEmbed.setThumbnail('https://i.imgur.com/1Q41hhC.png');
		} else if((post.size?.[0] ?? 0) >= (post.size?.[1] ?? 0))
			postEmbed.setThumbnail('https://i.imgur.com/oXE6CeF.png');

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
		const tagsTitle = `${gEmo('tagswhite', s3)} Tags (${displayedTagsCount}/${actualTotalTags})`;
		const tagsContent = `${specialTags.join(' ')} ${formatTagNameListNew(otherTags, ' ')}`.trim();

		const addTagCategoryField = (/**@type {String}*/ fieldName, /**@type {Array<String>}*/arr) => {
			if(!arr.length) return;

			const totalCount = arr.length;
			let partialCount = arr.length;
			if(arr.length > 4) {
				arr = arr
					.with(3, '(...)')
					.slice(0, 4);
				partialCount = 3;
			}

			let content = formatTagNameListNew(arr, '\n');
			if(!content.length) return;
			
			const infoSuffix = partialCount < totalCount ? ` (${partialCount}/${totalCount})` : '';
			postEmbed.addFields({ name: `${fieldName}${infoSuffix}`, value: shortenText(content, 1020), inline: true });
		}
		
		debug('A punto de formular etiquetas en el Embed del mensaje');
		addTagCategoryField('<:palette:1355128249658638488> Artistas',   postArtistTags);
		addTagCategoryField('<:person:1355128242993893539> Personajes',  postCharacterTags);
		addTagCategoryField('<:landmark:1355128256432443584> Copyright', postCopyrightTags);

		debug('Comprobando si se debe insertar un campo de tags sin categoría');
		debug('displayedTagsCount =', displayedTagsCount);
		if(displayedTagsCount > 0) {
			debug('A punto de insertar un campo de tags sin categoría');
			postEmbed.addFields({ name: tagsTitle, value: shortenText(tagsContent, 1020) });
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
			const tagsTitle = `${gEmo('tagswhite', globalConfigs.slots.slot3)} Tags (${displayedTagsCount}/${actualTotalTags})`;
			const tagsContent = `${specialTags.join(' ')} ${formatTagNameListNew(filteredTags, ' ')}`.trim();
			postEmbed.addFields({ name: tagsTitle, value: shortenText(tagsContent, 1020) });
		}
	}

	post.tags = originalPostTags;
	
	info('Finalizando preparación del Embed del mensaje');

	debug('Procesando título');
	if(data.title)
		postEmbed.setTitle(data.title);

	debug('Comprobando bloqueo de contenido explícito de Post según el canal del mensaje');
	const shouldBlock = (post.rating === 'explicit' || post.rating === 'questionable') && !data.allowNSFW;
	if(shouldBlock)
		postEmbed.setFooter({ text: data.footer || (post.rating === 'explicit' ? '❗' : '❓'), iconURL: 'https://i.imgur.com/jJD57ue.png' });
	else if(data.footer)
		postEmbed.setFooter({ text: data.footer });
	
	if(!shouldBlock) {
		debug('El contenido no fue bloqueado. Se agregará al mensaje a continuación');
		if(/\.(mp4|webm|webp)/.test(post.fileUrl)) {
			debug('El contenido es un video');
			postEmbed.addFields({ name: '<:video:1355885122846720041> Video', value: `[Mirar en navegador](${post.fileUrl})` });
			postEmbed.setImage(post.sampleUrl || post.previewUrl);
		} else if(/\.gif/.test(post.fileUrl)) {
			debug('El contenido es un GIF');
			postEmbed.setImage(post.fileUrl);
		} else {
			debug('El contenido es probablemente una imagen estática');
			postEmbed.setImage(
				post.sampleUrl
				|| post.fileUrl
				|| post.previewUrl
			);
		}
	}

	info('Se terminó de formatear el mensaje acorde a un Post de Booru');
	
	return postMessageData;
};

/**
 * Envía una notificación de {@linkcode Post} de {@linkcode Booru} a todos los {@linkcode User} suscriptos a las tags del mismo
 * @typedef {{ userId: import('discord.js').Snowflake, followedTags: Array<String> }} Suscription
 * @param {Post} post
 * @param {Message<true>} sent
 * @param {Array<Suscription>} feedSuscriptions 
 */
async function notifyUsers(post, sent, feedSuscriptions) {
	info('Se recibió una orden para notificar sobre un nuevo Post a usuarios suscriptos aplicables');

	//No sé qué habré estado pensando cuando escribí esto, pero no pienso volver a tocarlo
	
	if(!sent)
		throw 'Se esperaba un mensaje para el cuál notificar';

	if(!sent.embeds?.[0] || !sent.components?.[0])
		throw 'Se esperaba un mensaje de Feed válido';

	const channel = sent.channel;
	if(!channel)
		throw 'No se encontró un canal para el mensaje enviado';

	const guild = channel.guild;
	const matchingSuscriptions = feedSuscriptions.filter(suscription => suscription.followedTags.some(tag => post.tags.includes(tag)));
	if(!matchingSuscriptions.length) {
		info('No se encontraron suscripciones aplicables para el Post procesado');
		return [];
	}

	info('Se encontraron suscripciones aplicables, intentando enviar notificaciones...');

	debug('Obteniendo miembros de suscripciones aplicables...');
	const members = await guild.members.fetch();

	debug('Intentando enviar notificaciones...');
	return Promise.all(matchingSuscriptions.map(async ({ userId, followedTags }) => {
		const member = members.get(userId);
		if(!channel || !member)
			return Promise.resolve(null);

		const translator = await Translator.from(member.id);
		const matchingTags = followedTags.filter(tag => post.tags.includes(tag));

		const userEmbed = new EmbedBuilder()
			.setColor(sent.embeds[0].color ?? 0)
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
		
		const postRow = makeButtonRowBuilder(sent.components[0]);
		postRow.components.splice(postRow.components.length - 2);
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
	if(!isNsfw)
		return false;
	if(terms.includes('holo'))
		return true;
	if(!terms.includes('megumin'))
		return false;
	if(request.userId === globalConfigs.peopleid.papita)
		return false;

	return true;
}

/**
 * Busca las tags de {@linkcode Booru} deseadas y envía {@linkcode Message}s acorde a la petición
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest} request
 * @param {import('../../commands/Commons/typings').CommandArguments} args
 * @param {Boolean} isSlash
 * @param {CommandOptions} options
 * @param {{ cmdtag: keyof tagMaps, nsfwtitle: String, sfwtitle: String }} [searchOpt]
 * @returns {Promise<Array<Message<true>> | Message<true>>}
 */
async function searchAndReplyWithPost(request, args, isSlash, options, searchOpt = { cmdtag: 'general', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
	info('Se recibió una solicitud de respuesta con Posts resultados de búsqueda de Booru');

	const isnsfw = isThread(request.channel)
		? request.channel.parent.nsfw
		: request.channel.nsfw;
	
	const poolSize = options.fetchFlag(args, 'bomba', { callback: f => Math.max(2, Math.min(+f, 10)), fallback: 1 });
	const words = isSlash
		? ((/**@type {import('../../commands/Commons/typings').SlashArguments}*/(args)).getString('etiquetas') ?? '').split(/ +/)
		: (/**@type {Array<string>}*/(args));
	debug('poolSize =', poolSize);

	debug('Verificando que la solicitud haya sido aprobada por el Vaticano');
	if(isUnholy(isnsfw, request, [ searchOpt.cmdtag, ...words ]))
		return rakki.execute(request, [], isSlash);

	debug('Comunicando retraso de respuesta a interacción...');
	await request.deferReply();

	debug('Se están por obtener tags de búsqueda a partir de la consulta del usuario');
	const baseTags = getBaseTags('gelbooru', isnsfw);
	const searchTags = [ searchOpt.cmdtag, baseTags ].join(' ');
	const userTags = getSearchTags(words, 'gelbooru', searchOpt.cmdtag);
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
			return /**@type {Promise<Message<true>>}*/(request.editReply(replyOptions));
		}

		debug('Se obtuvieron resultados de búsqueda válidos');

		//Seleccionar imágenes
		const posts = response
			.sort(() => 0.5 - Math.random())
			.slice(0, poolSize);

		debug('posts =', posts);

		//Crear presentaciones
		info('Preparando mensaje(s) de respuesta de búsqueda...');
		const messages = await Promise.all(posts.map(post => formatBooruPostMessage(booru, post, {
			maxTags: 20,
			title: isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle,
			cornerIcon: author.avatarURL({ size: 128 }),
			manageableBy: author.id,
			allowNSFW: isnsfw,
			isNotFeed: true,
		})));

		if(userTags.length)
			messages[posts.length - 1].embeds[0].addFields({ name: '<:magGlassRight:1355133928721088592> Tu búsqueda', value: formatTagNameListNew(userTags.trim().split(/ +/), ' ') });

		//Enviar mensajes
		info('Enviando mensaje(s) de respuesta de búsqueda...');
		const replyOptions = messages.shift();
		await request.editReply(replyOptions);
		return Promise.all(messages.map(message => request.channel.send(message)))
			.catch(err => {
				error(err, 'Ocurrió un problema al intentar enviar los resultados de búsqueda de Booru');
				return /**@type {Array<Message<true>>}*/([]);
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
			
		return /**@type {Promise<Message<true>>}*/(request.editReply({ embeds: [errorEmbed] }));
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
		.map(tagName => tagName === '(...)' ? '-# …' : formatTagNameNew(tagName))
		.join(sep);
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
};
