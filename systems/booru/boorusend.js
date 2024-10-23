const { makeButtonRowBuilder } = require('../../tsCasts');
//@ts-expect-error
const { EmbedBuilder, ButtonBuilder, ButtonStyle, Colors, Message, User, Snowflake, ActionRowBuilder } = require('discord.js');
//@ts-expect-error
const { ComplexCommandRequest, CommandArguments } = require('../../commands/Commons/typings');
const { CommandOptions } = require('../../commands/Commons/cmdOpts');
const { guildEmoji: gEmo, shortenText, isThread } = require('../../func');
const { Post, Booru, TagTypes } = require('./boorufetch');
const { getBaseTags, getSearchTags, tagMaps } = require('../../localdata/booruprops');
const globalConfigs = require('../../localdata/config.json');
const rakki = require('../../commands/Pure/rakkidei');
const { Translator } = require('../../internationalization');

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
];

/**@type {ReadonlyArray<SourceStyle & { pattern: RegExp }>}*/
const sources = [
	{ color: 0x0096fa, emoji: '919403803126661120',  pattern: /pixiv\.net/ },
	{ color: 0x040404, emoji: '1232243415165440040', pattern: /(twitter|twimg|x)\.com/ },
	{ color: 0xfaf18a, emoji: '999783444655648869',  pattern: /fanbox\.cc/ },
	{ color: 0xea4c89, emoji: '1000265840182181899', pattern: /fantia\.jp/ },
	{ color: 0x28837f, emoji: '1001397393511682109', pattern: /skeb\.jp/ },
	{ color: 0x0085ff, emoji: '1298259199477678115', pattern: /bsky\.app/ },
	{ color: 0x009c94, emoji: '1297689776941568073', pattern: /lofter\.com/ },
	{ color: 0x23aee5, emoji: '1297697987014824066', pattern: /t\.bilibili\.com/ },
	{ color: 0x020814, emoji: '1298264258991095850', pattern: /cara\.app/ },
	{ color: 0x36465d, emoji: '969666470252511232',  pattern: /tumblr\.com/ },
	{ color: 0xff6c60, emoji: '919403803114094682',  pattern: /nitter\.net/ },
	{ color: 0xfcbd00, emoji: '1298305816247664640', pattern: /drive\.google\.com/ },
	{ color: 0xff4500, emoji: '969666029045317762',  pattern: /(reddit\.com)|(([iv]\.)?redd\.it)/ },
];

/**@type {SourceStyle}*/
const noSource = { color: Colors.Aqua, emoji: undefined };

/**@type {SourceStyle}*/
const unknownSource = { color: 0x1bb76e, emoji: '969664712604262400' };

/**
 * Genera un {@linkcode EmbedBuilder} a base de un {@linkcode Post} de {@linkcode Booru}
 * @param {Booru} booru Instancia de Booru
 * @param {Post} post Post de Booru
 * @param {PostFormatData} data Información adicional a mostrar en el Embed. Se puede pasar un Feed directamente
 * @returns {Promise<PostMessageOptions>}
 */
async function formatBooruPostMessage(booru, post, data = {}) {
	const maxTags = data.maxTags ?? 20;
	//Botón de Post de Gelbooru
	const row = makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setEmoji('919398540172750878')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`),
	);
	/**@type {import('discord.js').ColorResolvable}*/
	let embedColor;
	let sourceNumber = 0;

	//Botón de Fuente (si está disponible)
	const addSourceButtonAndApplyStyle = (/**@type {String}*/ source) => {
		if(!source) return;

		//Si no es un enlace, mostrar el source en texto
		if(!source.match(/(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-])+\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?/)) {
			return row.addComponents(
				new ButtonBuilder()
					.setCustomId(`feed_plainText${sourceNumber++}`)
					.setEmoji(unknownSource.emoji)
					.setStyle(ButtonStyle.Secondary)
					.setLabel(shortenText(source, 72))
					.setDisabled(true),
			);
		}

		sourceMappings.forEach(mapping => {
			source = source.replace(mapping.pattern, mapping.replacement);
		});

		//Dar estilo a Embed según fuente de la imagen
		const sourceStyle = sources.find(s => s.pattern.test(source)) ?? unknownSource;
		const emoji = sourceStyle.emoji;
		embedColor ??= sourceStyle.color;

		if(source.length > 512)
			return row.addComponents(
				new ButtonBuilder()
					.setEmoji(emoji)
					.setStyle(ButtonStyle.Danger)
					.setCustomId('feed_invalidUrl')
					.setDisabled(true),
			);

		row.addComponents(
			new ButtonBuilder()
				.setEmoji(emoji)
				.setStyle(ButtonStyle.Link)
				.setURL(source),
		);
	};

	//Aplicar estilo y botones de source
	const source = post.source;
	if(source) {
		const sources = (typeof source === 'object')
			? Object.values(source)
			: source.split(/[ \n]+/);
		sources.slice(0, 2).forEach(addSourceButtonAndApplyStyle);
	}
	embedColor ??= noSource.color;
	
	//Botón de tags
	row.addComponents(
		new ButtonBuilder()
			.setEmoji('921788204540100608')
			.setStyle(ButtonStyle.Primary)
			.setCustomId(`feed_showFeedImageTags_${data.isNotFeed ? 'NaF' : ''}`),
	);
	
	//Botón de eliminación
	row.addComponents(
		new ButtonBuilder()
			.setEmoji('921751138997514290')
			.setStyle(ButtonStyle.Danger)
			.setCustomId(`feed_deletePost_${data.manageableBy ?? ''}_${data.isNotFeed ?? ''}`),
	);

	//Preparar Embed final
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
	try {
		const postTags = await booru.fetchPostTags(post);

		//Advertencia de IA
		if(postTags.some(t => [ 'ai-generated', 'ai-assisted' ].includes(t.name)))
			postEmbed.setThumbnail('https://i.imgur.com/1Q41hhC.png');

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

		const s3 = globalConfigs.slots.slot3;
		const otherTags = postOtherTags.slice(0, maxTags);
		const tagsTitle = `${gEmo('tagswhite', s3)} Tags (${otherTags.length}/${post.tags.length})`;
		const tagsContent = formatTagNameList(otherTags, ' ');

		const addTagCategoryField = (/**@type {String}*/ fieldName, /**@type {Array<String>}*/arr) => {
			if(!arr.length) return;

			if(arr.length > 4) {
				arr = arr
					.with(3, '(...)')
					.slice(0, 4);
			}

			let content = formatTagNameList(arr, '\n', { leftStr: '* ' });
			if(!content.length) return;

			postEmbed.addFields({ name: fieldName, value: shortenText(content, 1020), inline: true });
		}
		
		addTagCategoryField(`${gEmo('pencilwhite', s3)} Artistas`,    postArtistTags);
		addTagCategoryField(`${gEmo('personwhite', s3)} Personajes`,  postCharacterTags);
		addTagCategoryField(`${gEmo('questionwhite', s3)} Copyright`, postCopyrightTags);

		if(maxTags > 0)
			postEmbed.addFields({ name: tagsTitle, value: `_${shortenText(tagsContent, 1020)}_` });
	} catch(err) {
		console.error(err);
		const postTags = post.tags;
		if(maxTags > 0 && postTags.length) {
			const filteredTags = postTags.slice(0, maxTags);
			const tagsTitle = `${gEmo('tagswhite', globalConfigs.slots.slot3)} Tags (${filteredTags.length}/${post.tags.length})`;
			const tagsContent = formatTagNameList(filteredTags, ' ');
			postEmbed.addFields({ name: tagsTitle, value: `_${shortenText(tagsContent, 1020)}_` });
		}
	}
	
	if(data.title)
		postEmbed.setTitle(data.title);

	const shouldBlock = (post.rating === 'explicit' || post.rating === 'questionable') && !data.allowNSFW;

	if(shouldBlock)
		postEmbed.setFooter({ text: data.footer || (post.rating === 'explicit' ? '❗' : '❓'), iconURL: 'https://i.imgur.com/jJD57ue.png' });
	else if(data.footer)
		postEmbed.setFooter({ text: data.footer });
	
	if(!shouldBlock) {
		if(/\.(mp4|webm|webp)/.test(post.fileUrl)) {
			postEmbed.addFields({ name: 'Video', value: `[Míralo en tu navegador (<:gelbooru:919398540172750878>)](${post.fileUrl})` });
			postEmbed.setImage(post.sampleUrl || post.previewUrl);
		} else if(/\.gif/.test(post.fileUrl))
			postEmbed.setImage(post.fileUrl);
		else
			postEmbed.setImage(
				post.sampleUrl
				|| post.fileUrl
				|| post.previewUrl
			);
	}
	
	return postMessageData;
};

/**
 * Envía una notificación de {@linkcode Post} de {@linkcode Booru} a todos los {@linkcode User} suscriptos a las tags del mismo
 * @typedef {{ userId: Snowflake, followedTags: Array<String> }} Suscription
 * @param {Post} post
 * @param {Message<true>} sent
 * @param {Array<Suscription>} feedSuscriptions 
 */
async function notifyUsers(post, sent, feedSuscriptions) {
	if(!sent) throw 'Se esperaba un mensaje para el cuál notificar';
	if(!sent.embeds?.[0] || !sent.components?.[0]) throw 'Se esperaba un mensaje de Feed válido';
	const channel = sent.channel;
	if(!channel) throw 'No se encontró un canal para el mensaje enviado';
	const guild = channel.guild;
	const matchingSuscriptions = feedSuscriptions.filter(suscription => suscription.followedTags.some(tag => post.tags.includes(tag)));
	const members = await guild.members.fetch();

	return Promise.all(matchingSuscriptions.map(async ({ userId, followedTags }) => {
		const member = members.get(userId);
		if(!channel || !member) return Promise.resolve(null);
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
		}).catch(_ => null);
	}));
}

/**
 * De naturaleza memética.
 * Comprueba si la búsqueda de tags de {@linkcode Booru} no es aprobada por Dios
 * @param {Boolean} isNsfw 
 * @param {ComplexCommandRequest} request 
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
 * @param {ComplexCommandRequest} request
 * @param {CommandArguments} args
 * @param {Boolean} isSlash
 * @param {CommandOptions} options
 * @param {{ cmdtag: keyof tagMaps, nsfwtitle: String, sfwtitle: String }} [searchOpt]
 * @returns {Promise<Array<Message<true>> | Message<true>>}
 */
async function searchAndReplyWithPost(request, args, isSlash, options, searchOpt = { cmdtag: 'general', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
	const isnsfw = isThread(request.channel)
		? request.channel.parent.nsfw
		: request.channel.nsfw;
	
	const poolSize = options.fetchFlag(args, 'bomba', { callback: f => Math.max(2, Math.min(+f, 10)), fallback: 1 });
	const words = isSlash
		// @ts-expect-error
		? (args.getString('etiquetas') ?? '').split(/ +/)
		: args;

	//Bannear lewds de Megumin y Holo >:C
	if(isUnholy(isnsfw, request, [ searchOpt.cmdtag, ...words ]))
		return rakki.execute(request, [], isSlash);

	await request.deferReply();

	const baseTags = getBaseTags('gelbooru', isnsfw);
	const searchTags = [ searchOpt.cmdtag, baseTags ].join(' ');
	const userTags = getSearchTags(words, 'gelbooru', searchOpt.cmdtag);
	/**@type {import('discord.js').User} */
	const author = request.user;
	
	//Petición
	try {
		const booru = new Booru(globalConfigs.booruCredentials);
		const response = await booru.search([ searchTags, userTags ], { limit: 100, random: true });
		//Manejo de respuesta
		if(!response.length) {
			const replyOptions = { content: `⚠️ No hay resultados en **Gelbooru** para las tags **"${userTags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` };
			//@ts-expect-error
			return request.editReply(replyOptions);
		}

		//Seleccionar imágenes
		const posts = response
			.sort(() => 0.5 - Math.random())
			.slice(0, poolSize);

		//Crear presentaciones
		const messages = await Promise.all(posts.map(post => formatBooruPostMessage(booru, post, {
			maxTags: 40,
			title: isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle,
			cornerIcon: author.avatarURL({ size: 128 }),
			manageableBy: author.id,
			allowNSFW: isnsfw,
			isNotFeed: true,
		})));
		if(userTags.length)
			messages[posts.length - 1].embeds[0].addFields({ name: 'Tu búsqueda', value: `:mag_right: *${userTags.trim().replace(/\*/g, '\\*').split(/ +/).join(', ')}*` });

		//Enviar mensajes
		const replyOptions = messages.shift();
		await request.editReply(replyOptions);
		return Promise.all(messages.map(message => request.channel.send(message))).catch(_ => console.error && []);
	} catch(error) {
		console.error(error);
		const errorembed = new EmbedBuilder()
			.setColor(Colors.Red)
			.addFields({
				name: 'Ocurrió un error al realizar una petición',
				value: [
					'Es probable que le hayan pegado un tiro al que me suministra las imágenes, así que prueba buscar más tarde, a ver si revive 👉👈',
					'```js',
					`${[error.name, error.message].join(': ')}\n`,
					'```',
				].join('\n'),
			});
		//@ts-expect-error
		return request.editReply({ embeds: [errorembed] });
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

module.exports = {
	formatBooruPostMessage,
	notifyUsers,
	searchAndReplyWithPost,
	formatTagName,
	formatTagNameList,
};
