const Discord = require('discord.js');
const MessageCascades = require('../localdata/models/messageCascades.js');
const { channelIsBlocked, isUsageBanned, fetchMessage } = require('../func.js');

/**@type {Map<String, String>}*/
const messageCascadesCache = new Map();

/**
 * @param {Discord.Message | Discord.PartialMessage} message
 */
async function onMessageDelete(message) {
	const { author } = message;
	
	if(!author || author.bot || !message.inGuild() || channelIsBlocked(message.channel) || (await isUsageBanned(author)))
		return;

	const { id: messageId, guild, channel } = message;

	const otherMessageId = messageCascadesCache.get(messageId);
	if(!otherMessageId) return;
	
	const otherMessage = await fetchMessage(otherMessageId, { guild, channel });
	messageCascadesCache.delete(messageId);
	return otherMessage.deletable && otherMessage.delete().catch(console.error);
}

/**
 * 
 * @param {String} messageId 
 * @param {String} otherMessageId 
 * @param {Date} expirationDate 
 */
function addMessageCascade(messageId, otherMessageId, expirationDate) {
	messageCascadesCache.set(messageId, otherMessageId);
	return (MessageCascades.create({ messageId, otherMessageId, expirationDate }));
}

/**
 * 
 * @param {String} messageId 
 * @param {String} otherMessageId 
 */
function cacheMessageCascade(messageId, otherMessageId) {
	messageCascadesCache.set(messageId, otherMessageId);
}

async function deleteExpiredMessageCascades() {
    const cachedMessageIds = [ ...messageCascadesCache.keys() ];

	return MessageCascades.deleteMany({ 
		$or: [
            { messageId: { $nin: cachedMessageIds } },
			{ expirationDate: { $lt: new Date(Date.now()) } },
        ]
	}).catch(console.error);
}

module.exports = {
	onMessageDelete,
	addMessageCascade,
	cacheMessageCascade,
	deleteExpiredMessageCascades,
};
