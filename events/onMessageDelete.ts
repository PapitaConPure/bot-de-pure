import MessageCascades from '../models/messageCascades.js';
import { channelIsBlocked, isUsageBanned, fetchMessage } from '../func';
import { Message, PartialMessage } from 'discord.js';

const messageCascadesCache: Map<string, string> = new Map();

export async function onMessageDelete(message: Message | PartialMessage) {
	const { author } = message;
	
	if(!author || author.bot || !message.inGuild() || channelIsBlocked(message.channel) || (await isUsageBanned(author)))
		return;

	const { id: messageId, guild, channel } = message;

	const otherMessageId = messageCascadesCache.get(messageId);
	if(!otherMessageId) return;
	
	const otherMessage = await fetchMessage(otherMessageId, { guild, channel });
	messageCascadesCache.delete(messageId);
	return otherMessage?.deletable && otherMessage.delete().catch(console.error);
}

export function addMessageCascade(messageId: string, otherMessageId: string, expirationDate: Date) {
	messageCascadesCache.set(messageId, otherMessageId);
	return (MessageCascades.create({ messageId, otherMessageId, expirationDate }));
}

export function cacheMessageCascade(messageId: string, otherMessageId: string) {
	messageCascadesCache.set(messageId, otherMessageId);
}

export async function deleteExpiredMessageCascades() {
    const cachedMessageIds = [ ...messageCascadesCache.keys() ];

	return MessageCascades.deleteMany({ 
		$or: [
            { messageId: { $nin: cachedMessageIds } },
			{ expirationDate: { $lt: new Date(Date.now()) } },
        ]
	}).catch(console.error);
}
