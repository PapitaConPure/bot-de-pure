const { sleep } = require('../../func.js');

const { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessagePayload, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { DiscordAgent, addAgentMessageOwner } = require('./discordagent.js');

const tweetRegex = /<?(https?:\/\/)(www.)?(twitter|x).com\/(\w+)\/status\/(\d+)>?/g;

/**
 * Detecta enlaces de Tweeter en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message<true>} message El mensaje a analizar
 * @param {String} configPrefix El mensaje a analizar
 */
const sendTweetsAsWebhook = async (message, configPrefix) => {
	if(configPrefix === '') return;

	const { content, channel, author } = message;
	if(!message.guild.members.me.permissionsIn(channel).has([ /*'ManageWebhooks', */'SendMessages', 'AttachFiles' ]))
		return false;

	const matches = content.match(tweetRegex);

	if(matches === null)
		return false;

	const tweetUrls = matches.filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')));

	if(!tweetUrls.length)
		return false;

	const configProps = {
		vx: { name: 'vxTwitter', service: 'https://fixvx.com' },
		fx: { name: 'fixTwitter', service: 'https://fxtwitter.com' },
	};
	const configProp = configProps[configPrefix];

	if(configProp == undefined)
		return false;
	
	let service = configProp.service;

	try {
		const fixedMessage = await message.reply({ content: message.content.replace(/https:\/\/(twitter|x).com/g, service) });
		await sleep(750 + fixedMessage.embeds.length * 450);

		const timestamps = message.embeds
			.filter(embed => embed.timestamp)
			.map(embed => new Date(embed.timestamp));

		const videos = [];
		fixedMessage.embeds = fixedMessage.embeds.map(embed => {
			const e = EmbedBuilder.from(embed);

			if(embed.url.startsWith(service)) {
				e.setAuthor(null)
					.setColor(0x1da0f2)
					.setFooter({ text: configProp.name, iconURL: 'https://i.imgur.com/qJmRBJZ.png' })
					.setTimestamp(timestamps.shift() ?? null);

				if(embed.thumbnail?.url) {
					e.setThumbnail(null)
					 .setImage(embed.thumbnail.url);
				}
			}
			
			if(embed.video?.url) {
				videos.push(`[Video ${videos.length + 1}](${embed.url})`);
				return null;
			}

			return e;
		}).filter(embed => embed);

		let secondarySent = null;
		const agent = await (new DiscordAgent().setup(channel));
		agent.setUser(author);
		if(fixedMessage.embeds.length > 0) {
			const fixedSent = await agent.sendAsUser(fixedMessage, false);
			if(videos.length > 0)
				secondarySent = await (fixedSent ?? message).reply({ content: videos.join(', ') });
		} else {
			secondarySent = await message.reply({ content: fixedMessage.content });
		}

		if(secondarySent != null)
			addAgentMessageOwner(secondarySent);
		
		await fixedMessage.delete().catch(_ => null);

		return true;
	} catch(e) {
		console.error(e);
	}

	return false;
};

module.exports = {
	tweetRegex,
	sendTweetsAsWebhook,
};