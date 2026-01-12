const { ChannelType } = require('discord.js');
const { ConverterEmptyPayload } = require('./converters');
const Logger = require('../../utils/logs').default;

const { error } = Logger('WARN', 'Puréet');

const acceptedTwitterConvertersWithoutNone = /**@type {const}*/([ 'vx', 'fx', 'girlcockx', 'cunnyx' ]);
const acceptedTwitterConverters = /**@type {const}*/([ '', ...acceptedTwitterConvertersWithoutNone ]);
const tweetRegex = /(?:<|\|{2})? ?((?:https?:\/\/)(?:www.)?(?:twitter|x).com\/(\w+)\/status\/(\d+)(?:\/([A-Za-z]+))?) ?(?:>|\|{2})?/g;

/**
 * @typedef {typeof acceptedTwitterConvertersWithoutNone[number]} AcceptedTwitterConverterKey
 * @satisfies {Record<AcceptedTwitterConverterKey, { name: string, service: string }>}
 */
const twitterConversionServices = {
	vx: { name: 'vxTwitter', service: 'https://fixvx.com' },
	fx: { name: 'fixTwitter', service: 'https://fxtwitter.com' },
	girlcockx: { name: 'girlcockx', service: 'https://girlcockx.com' },
	cunnyx: { name: 'cunnyx', service: 'https://cunnyx.com' },
};

/**
 * Detecta enlaces de Twitter en un mensaje y los reenvía con un Embed corregido, a través de una respuesta.
 * @param {import('discord.js').Message<true>} message El mensaje a analizar
 * @param {AcceptedTwitterConverterKey | ''} converterKey El identificador de servicio de conversión a utilizar
 * @returns {Promise<import('./converters').ConverterPayload>}
 */
async function sendConvertedTwitterPosts(message, converterKey) {
	if(converterKey === '')
		return ConverterEmptyPayload;

	const { content: messageContent, channel } = message;
	
	if(!message.guild.members.me.permissionsIn(channel).has([ 'SendMessages', 'ManageMessages', 'AttachFiles' ]))
		return ConverterEmptyPayload;

	if(channel.type === ChannelType.PublicThread) {
		try {
			const { parent } = channel;
			if(parent.type === ChannelType.GuildForum && (await channel.fetchStarterMessage()).id === message.id)
				return ConverterEmptyPayload;
		} catch(err) {
			error(err);
			return ConverterEmptyPayload;
		}
	}

	const tweetUrls = [ ...messageContent.matchAll(tweetRegex) ]
		.filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')))
		.slice(0, 16);

	if(!tweetUrls.length)
		return ConverterEmptyPayload;

	const configProp = twitterConversionServices[converterKey];
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
				warnAboutUnsupportedTranslationUrls ||= (ls && converterKey === 'vx');
			}
			return `${spoiler}<:twitter2:1232243415165440040>[\`${artist}/${id}\`](${service}/${artist}/status/${id}${langSuffix})${spoiler}`;
		});
	
	let content = formattedTweetUrls.join(' ');
	if(warnAboutUnsupportedTranslationUrls)
		content += '\n-# ⚠️️ El conversor de vxTwitter todavía no tiene una característica de traducción';

	return {
		contentful: true,
		content,
	};
};

module.exports = {
	tweetRegex,
	sendConvertedTwitterPosts,
	acceptedTwitterConverters,
};
