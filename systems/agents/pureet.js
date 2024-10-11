const { Message, ChannelType } = require('discord.js');
const { addAgentMessageOwner } = require('./discordagent.js');
const { addMessageCascade } = require('../../events/onMessageDelete.js');

const tweetRegex = /(?:<|\|{2})? ?((?:https?:\/\/)(?:www.)?(?:twitter|x).com\/(\w+)\/status\/(\d+)) ?(?:>|\|{2})?/g;
const configProps = {
	vx: { name: 'vxTwitter', service: 'https://fixvx.com' },
	fx: { name: 'fixTwitter', service: 'https://fxtwitter.com' },
};

/**
 * Detecta enlaces de Tweeter en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message<true>} message El mensaje a analizar
 * @param {''|'vx'|'fx'} configPrefix El mensaje a analizar
 */
const sendTweetsAsWebhook = async (message, configPrefix) => {
	if(configPrefix === '') return;

	const { content, channel, author } = message;
	
	if(!message.guild.members.me.permissionsIn(channel).has([ 'SendMessages', 'ManageMessages', 'AttachFiles' ]))
		return false;

	if(channel.type === ChannelType.PublicThread) {
		const { parent } = channel;
		if(parent.type === ChannelType.GuildForum && (await channel.fetchStarterMessage()).id === message.id)
			return false;
	}

	const tweetUrls = [ ...content.matchAll(tweetRegex) ]
		.filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')))
		.slice(0, 16);

	if(!tweetUrls.length)
		return false;

	const configProp = configProps[configPrefix];
	if(configProp == undefined)
		return false;
	
	const service = configProp.service;
	const formattedTweetUrls = tweetUrls
		.map(u => {
			const [ match, _url, artist, id ] = u;
			const spoiler = (match.startsWith('||') && match.endsWith('||'))
				? '||'
				: '';
			return `${spoiler}[${artist}/${id}](${service}/${artist}/status/${id})${spoiler}`;
		});
	
	try {
		const [ sent ] = await Promise.all([
			message.reply({ content: formattedTweetUrls.join(' ') }),
			message.suppressEmbeds(true),
		]);
		
		setTimeout(() => {
			if(!message?.embeds) return;
			message.suppressEmbeds(true).catch(_ => undefined);
		}, 3000);

		await Promise.all([
			addAgentMessageOwner(sent, author.id),
			addMessageCascade(message.id, sent.id, new Date(+message.createdAt + 4 * 60 * 60e3)),
		]);
	} catch(e) {
		console.error(e);
	}

	return false;
};

module.exports = {
	tweetRegex,
	sendTweetsAsWebhook,
};
