const { ChannelType } = require('discord.js');
const { ConverterEmptyPayload } = require('./converters');

const acceptedTwitterConvertersWithoutNone = /**@type {const}*/([ 'vx', 'fx', 'girlcockx', 'cunnyx' ]);
const acceptedTwitterConverters = /**@type {const}*/([ '', ...acceptedTwitterConvertersWithoutNone ]);
const tweetRegex = /(?:<|\|{2})? ?((?:https?:\/\/)(?:www.)?(?:twitter|x).com\/(\w+)\/status\/(\d+)(?:\/([A-Za-z]+))?) ?(?:>|\|{2})?/g;
/**
 * @typedef {typeof acceptedTwitterConvertersWithoutNone[number]} AcceptedTwitterConverterKey
 * @satisfies {Record<AcceptedTwitterConverterKey, { name: string, service: string }>}
 */
const configProps = {
	vx: { name: 'vxTwitter', service: 'https://fixvx.com' },
	fx: { name: 'fixTwitter', service: 'https://fxtwitter.com' },
	girlcockx: { name: 'girlcockx', service: 'https://girlcockx.com' },
	cunnyx: { name: 'cunnyx', service: 'https://cunnyx.com' },
};

/**
 * Detecta enlaces de Twitter en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {import('discord.js').Message<true>} message El mensaje a analizar
 * @param {AcceptedTwitterConverterKey | ''} configPrefix El mensaje a analizar
 * @returns {Promise<import('./converters').ConverterPayload>}
 */
async function sendConvertedTweets(message, configPrefix) {
	if(configPrefix === '')
		return ConverterEmptyPayload;

	const { content: messageContent, channel } = message;
	
	if(!message.guild.members.me.permissionsIn(channel).has([ 'SendMessages', 'ManageMessages', 'AttachFiles' ]))
		return ConverterEmptyPayload;

	if(channel.type === ChannelType.PublicThread) {
		const { parent } = channel;
		if(parent.type === ChannelType.GuildForum && (await channel.fetchStarterMessage()).id === message.id)
			return ConverterEmptyPayload;
	}

	const tweetUrls = [ ...messageContent.matchAll(tweetRegex) ]
		.filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')))
		.slice(0, 16);

	if(!tweetUrls.length)
		return ConverterEmptyPayload;

	const configProp = configProps[configPrefix];
	if(configProp == undefined)
		return ConverterEmptyPayload;
	
	let warnAboutUnsupportedTranslationUrls = false;
	const service = configProp.service;
	const formattedTweetUrls = tweetUrls
		.map(u => {
			const [ match, /*url*/, artist, id, ls ] = u;
			const spoiler = (match.startsWith('||') && match.endsWith('||'))
				? '||'
				: '';
			let langSuffix = '';
			if(ls && ls.length <= 2) {
				langSuffix = `/${ls}`;
				warnAboutUnsupportedTranslationUrls ||= (ls && configPrefix === 'vx');
			}
			return `${spoiler}<:twitter2:1232243415165440040>[\`${artist}/${id}\`](${service}/${artist}/status/${id}${langSuffix})${spoiler}`;
		});
	
	let content = formattedTweetUrls.join(' ');
	if(warnAboutUnsupportedTranslationUrls)
		content += '\n-# ⚠️️ El conversor de vxTwitter todavía no tiene una característica de traducción';

	return {
		shouldReplace: false,
		shouldReply: true,
		content,
	};
};

module.exports = {
	tweetRegex,
	sendConvertedTweets,
	acceptedTwitterConverters,
};
