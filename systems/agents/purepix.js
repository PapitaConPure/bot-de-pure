const { EmbedBuilder, AttachmentBuilder, ChannelType } = require('discord.js');
const pixivToken = process.env.PIXIV_REFRESH_TOKEN ?? (require('../../localenv.json')?.pixivtoken);
const { shortenTextLoose } = require('../../func');
const globalConfigs = require('../../localdata/config.json');
const { ConverterEmptyPayload } = require('./converters');

/**
 * @typedef {Object} ImageRequestOptions
 * @property {Object} headers
 * @property {import('axios').ResponseType} responseType
 */

/**@type {ImageRequestOptions}*/
const PIXIV_IMAGE_REQUEST_OPTIONS = {
	headers: {
		'Referer': 'http://www.pixiv.net',
		'Accept-Language': process.env.REGION ?? 'es-AR',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
	},
	responseType: 'arraybuffer',
};
const PIXIV_GALLERY_PAGE_SEPARATOR = '_';
const PIXIV_REGEX = /<?((http:\/\/|https:\/\/)(www\.)?)(pixiv.net(\/en)?)\/artworks\/([0-9]{6,9})(_[0-9]{1,4})?>?/g;
const PIXIV_REPLY_REGEX = /(?<st>(?:<|\|\|){0,2}) ?(?:(?:http:\/\/|https:\/\/)(?:www\.))?(?:pixiv.net(?<lang>\/en)?)\/artworks\/(?<id>[0-9]{6,9})(?:\/(?<page>[0-9]{1,4}))? ?(?<ed>(?:>|\|\|){0,2})/g;
const PIXIV_3P_CONVERTERS = {
	phixiv: { name: 'phixiv', service: 'https://www.phixiv.net' },
};

let performingAuthentication = false;

/**@deprecated*/
const refreshPixivAccessToken = async () => {
	if(globalConfigs.noDataBase) return;
	if(performingAuthentication) return;
	
	performingAuthentication = true;
	
	let authSuccess = false;
	let authAttempts = 0;
	//let response;

	while(!authSuccess && authAttempts < 3) {
		//console.log(`Attempting pixiv authentication... (${authAttempts + 1}/3)`);

		try {
			//response = await pixiv.refreshAccessToken(pixivToken);
			authSuccess = true;
		} catch(error) {
			//response = { error: error.message };
			console.error(error);
			authAttempts++;
		}

		if(!authSuccess)
			await new Promise(r => setTimeout(r, 3000 * authAttempts));
	}

	if(!authSuccess) {
		//console.log('Pixiv authentication failed');
		return false;
	}

	//const nextAuthDelaySeconds = Math.max(5, response.expires_in - 44.5);
	//console.log(`Pixiv authentication done. Next in ${nextAuthDelaySeconds}s`);
	//setTimeout(refreshPixivAccessToken, nextAuthDelaySeconds * 1000);
	performingAuthentication = false;

	return true;
};

/**
 * 
 * @param {string} url 
 * @returns {[ Number, Number, Boolean ]}
 * @deprecated
 */
function extractIdAndPage(url) {
	const data = url.split('/').pop();

	if(!isNaN(+data))
		return [ +data, 0, false ];

	const [ id, page ] = data.split(PIXIV_GALLERY_PAGE_SEPARATOR);

	return [ +id, +page - 1, true ];
}

/**
 * Analiza las urls ingresadas y devuelve data de mensaje con hasta 4 Embeds de pixiv relacionados
 * @param {Array<String>} urls Enlaces a imágenes de pixiv
 * @deprecated
 */
const formatPixivPostsMessage = async (urls) => {
	while(performingAuthentication)
		await new Promise(resolve => setTimeout(resolve, 50));
	
	return { embeds: [], files: [] };
	
	// const messageData = (await Promise.all(urls.slice(0, 4).map(async (url, i) => {
		// const [ postId, pageId, wantsSpecificPage ] = extractIdAndPage(url);
		
		// const post = (await pixiv.illustDetail(postId).catch(console.error))?.illust;
		// if(!post) return;

		// const baseUrl = url.split(PIXIV_GALLERY_PAGE_SEPARATOR).shift();

		// /**@type {Array<Buffer>}*/
		// const illustsToFetch = [];

		// /**@type {Array<*> | null}*/
		// const metaPages = post.meta_pages;
		// if(metaPages?.length && !wantsSpecificPage) {
		// 	for(let j = 0; j < metaPages.length && j < 4; j++)
		// 		illustsToFetch.push(pixiv.requestUrl(metaPages[j].image_urls.large || metaPages[j].image_urls.medium, PIXIV_IMAGE_REQUEST_OPTIONS));
		// } else {
		// 	const selectedPageNumber = metaPages?.[pageId] ? pageId : 0;
		// 	const selectedPageUrls = metaPages?.[selectedPageNumber]?.image_urls
		// 		|| post.image_urls;

		// 	illustsToFetch.push(pixiv.requestUrl(selectedPageUrls.large || selectedPageUrls.medium, PIXIV_IMAGE_REQUEST_OPTIONS));
		// }

		// /**@type {String}*/
		// const profileImageUrl = post.user.profile_image_urls.medium;
		// let profileAsset = 'https://s.pximg.net/common/images/no_profile.png';
		// illustsToFetch.unshift((profileImageUrl === profileAsset)
		// 	? profileAsset
		// 	: pixiv.requestUrl(profileImageUrl, PIXIV_IMAGE_REQUEST_OPTIONS));

		// const [ profileImage, ...illustImages ] = await Promise.all(illustsToFetch);

		// /**@type {Array<import('discord.js').AttachmentBuilder>}*/
		// const postAttachments = [];
		// illustImages.forEach((illustImage, j) => postAttachments.push(new AttachmentBuilder(illustImage, { name: `thumb${i}_p${j}.png` })));
		// postAttachments.push(new AttachmentBuilder(profileImage, { name: `pfp${i}.png` }));

		// let discordCaption = null;
		// if(post.caption?.length) {
		// 	discordCaption = shortenTextLoose(
		// 		post.caption
		// 			.replace(/\n/g, '')
		// 			.replace(/\*/g, '\\*')
		// 			.replace(/<\/?strong>/g, '*')
		// 			.replace(/<br ?\/?>/g, '\n')
		// 			.replace(/&#44;/g, ','),
		// 			//.replace(/<[^>]*>/g, ''),
		// 		256,
		// 		960,
		// 		' (...)',
		// 	)
		// 	.replace(/<a href=["']((https?:[^"']+)|(pixiv:\/\/[^"']+))["']( \w+=["'][^"']+["'])*>([^<]+)<\/a>/g, (_substr, url) => {
		// 		const labelLink = (icon, label) => `[ ${icon} ${label}](${url})`;
				
		// 		if(url.includes('x.com') ||url.includes('twitter.com') || url.includes('nitter.net'))
		// 			return labelLink('<:twitter:919403803114094682>', 'Twitter');
		// 		if(url.includes('fanbox.cc') || url.includes('pixiv.net/fanbox/'))
		// 			return labelLink('<:fanbox:999783444655648869>', 'FANBOX');
		// 		if(url.includes('fantia.jp'))
		// 			return labelLink('<:fantia:1000265840182181899>', 'Fantia');
		// 		if(url.includes('skeb.jp'))
		// 			return labelLink('<:skeb:1001397393511682109>', 'Skeb');
		// 		if(url.includes('pixiv.net'))
		// 			return labelLink('<:pixiv:919403803126661120>', 'pixiv');
		// 		if(url.includes('tumblr.com'))
		// 			return labelLink('<:tumblr:969666470252511232>', 'Tumblr');
		// 		if(url.includes('reddit.com'))
		// 			return labelLink('<:reddit:969666029045317762>', 'Reddit');

		// 		return labelLink('🔗', 'Link');
		// 	});
		
		// 	const discordCaptionLines = discordCaption.split('\n');
		// 	if(discordCaptionLines.length > 8)
		// 		discordCaption = [ ...discordCaptionLines.slice(0, 7), '(...)' ].join('\n');
		// }

		// let postTypeText;
		// if(metaPages?.length > 1)
		// 	postTypeText = `Galería (${metaPages.length})`;
		// else {
		// 	const postType = {
		// 		ugoira: 'Ugoira',
		// 		illust: 'Ilustración',
		// 		manga:  'Manga',
		// 	};
		// 	postTypeText = postType[post.type] ?? 'Imagen';
		// }
		
		// const postEmbeds = [
		// 	new EmbedBuilder()
		// 		.setColor(0x0096fa)
		// 		.setAuthor({
		// 			name: post.user.name,
		// 			url: `https://www.pixiv.net/users/${post.user.id}`,
		// 			iconURL: `attachment://pfp${i}.png`,
		// 		})
		// 		.setTitle(post.title)
		// 		.setDescription(discordCaption)
		// 		.setURL(baseUrl)
		// 		.setImage(`attachment://thumb${i}_p0.png`)
		// 		.setFooter({ text: `pixiv • ${postTypeText}`, iconURL: 'https://i.imgur.com/GDJ3mof.png' })
		// 		.setTimestamp(new Date(post.create_date))
		// 		.addFields({
		// 			name: `💬 ${post.total_comments} ❤ ${post.total_bookmarks} 👁 ${post.total_view}`,
		// 			value: post.tags.slice(0, 6).map(t => t.translated_name ?? t.name).join(', '),
		// 		})
		// ];

		// for(let j = 1; j < illustsToFetch.length; j++)
		// 	postEmbeds.push(new EmbedBuilder().setURL(baseUrl).setImage(`attachment://thumb${i}_p${j}.png`));

		// return { embeds: postEmbeds, files: postAttachments };
	// }))).reduce((a, b) => ({
		// embeds: [ ...a.embeds, ...b.embeds ],
		// files: [ ...a.files, ...b.files ],
	// }));
	
	// return messageData;
};

/**
 * @param {string} match 
 * @param {string} _p1 
 * @param {string} _p2 
 * @param {string} _p3 
 * @param {string} _p4 
 * @param {string} _p5 
 * @param {string} p6 
 * @returns {string}
 * @deprecated
 */
function replacer(match, _p1, _p2, _p3, _p4, _p5, p6) {
	const data = match.split(PIXIV_GALLERY_PAGE_SEPARATOR);
	const baseUrl = data.shift();
	const pageNumber = data.pop();
	let display = `<:pixivcolor:1138853641600643174> [${p6}`;

	if(pageNumber)
		display += `#${pageNumber}`;

	display += `](${baseUrl})`;

	return display;
}

/**
 * Detecta enlaces de pixiv en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {import('discord.js').Message<true>} message El mensaje a analizar
 * @returns {Promise<import('./converters').ConverterPayload>}
 * @deprecated
 */
async function sendPixivPostsAsWebhook(message) {
	const { content, channel, member } = message;
	if(!message.guild.members.me.permissionsIn(channel).has([ 'ManageWebhooks', 'SendMessages', 'AttachFiles' ]))
		return ConverterEmptyPayload;

	const pixivUrls = Array.from(content.matchAll(PIXIV_REGEX))
		.filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')));

	if(!pixivUrls.length)
		return ConverterEmptyPayload;
	
	const newMessage = await formatPixivPostsMessage(pixivUrls.map(pixivUrl => pixivUrl[0]));
	message.content = content.replace(PIXIV_REGEX, replacer);
	//@ts-expect-error
	message.files ??= [];
	//@ts-expect-error
	message.files.push(...newMessage.files);
	message.embeds ??= [];
	
	//@ts-expect-error
	message.embeds = message.embeds
		//@ts-expect-error
		.filter(embed => embed.type === 'rich' || !embed.url.includes('pixiv.net'))
		.map(embed => {
			console.log(embed);
			
			//@ts-expect-error
			if(embed.type === 'rich')
				return EmbedBuilder.from(embed);
			
			if(embed.data.thumbnail && embed.data.type === 'image' && !embed.data.image) {
				//@ts-expect-error
				message.files.push(embed.thumbnail.url);
				return null;
			}

			if(embed.data.type === 'video') {
				//@ts-expect-error
				message.files.push(embed.video.url);
				return null;
			}
				
			return EmbedBuilder.from(embed);
		}).filter(embed => embed);

	message.embeds.push(...newMessage.embeds);

	try {
		return {
			shouldReplace: true,
			shouldReply: false,
			content: message.content,
			//@ts-expect-error
			embeds: message.embeds,
			//@ts-expect-error
			files: message.files,
		};
	} catch(e) {
		console.error(e);
	}

	return ConverterEmptyPayload;
};

/**
 * Detecta enlaces de pixiv en un mensaje y los reenvía con un Embed corregido, a través de una respuesta.
 * @param {import('discord.js').Message<true>} message El mensaje a analizar
 * @param {''|'phixiv'} configConverter El identificador de servicio de conversión a utilizar
 * @returns {Promise<import('./converters').ConverterPayload>}
 */
async function sendPixivPostsAsReply(message, configConverter) {
	if(configConverter === '')
		return ConverterEmptyPayload;

	const { content, channel } = message;
	
	if(!message.guild.members.me.permissionsIn(channel).has([ 'SendMessages', 'ManageMessages', 'AttachFiles' ]))
		return ConverterEmptyPayload;

	if(channel.type === ChannelType.PublicThread) {
		const { parent } = channel;
		if(parent.type === ChannelType.GuildForum && (await channel.fetchStarterMessage()).id === message.id)
			return ConverterEmptyPayload;
	}

	const pixivUrls = [ ...content.matchAll(PIXIV_REPLY_REGEX) ]
		.filter(u => !(u.groups.st?.includes('<') && u.groups.ed?.includes('>')))
		.slice(0, 16);

	if(!pixivUrls.length)
		return ConverterEmptyPayload;

	const configProp = PIXIV_3P_CONVERTERS[configConverter];
	if(configProp == undefined)
		return ConverterEmptyPayload;
	
	const service = configProp.service;
	const formattedPixivUrls = pixivUrls
		.map(u => {
			const { st = '', id, lang = '', page = null, ed = '' } = u.groups;
			const spoiler = st.includes('||') && ed.includes('||')
				? '||'
				: '';
			const idAndPage = page ? `${id}/${page}`: id;
			return `${spoiler}<:pixiv2:1334816111270563880>[\`${idAndPage}\`](${service}${lang}/artworks/${idAndPage})${spoiler}`;
		});
	
	return {
		shouldReplace: false,
		shouldReply: true,
		content: formattedPixivUrls.join(' '),
	};
}

/**
 * Detecta enlaces de pixiv en un mensaje y los reenvía con un Embed corregido.
 * @param {import('discord.js').Message<true>} message El mensaje a analizar
 * @param {''|'phixiv'} configConverter El identificador de servicio de conversión a utilizar
 * @returns {Promise<import('./converters').ConverterPayload>}
 */
async function sendConvertedPixivPosts(message, configConverter) {
	switch(configConverter) {
	case 'phixiv':
		return sendPixivPostsAsReply(message, configConverter);
		
	// case 'webhook':
	// 	return sendPixivPostsAsWebhook(message);

	default:
		return {
			shouldReplace: false,
			shouldReply: false,
		};
	}
}

module.exports = {
	pixivRegex: PIXIV_REGEX,
	refreshPixivAccessToken,
	formatPixivPostsMessage,
	sendPixivPostsAsWebhook,
	sendConvertedPixivPosts,
};