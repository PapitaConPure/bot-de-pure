import { deleteMessageCascade, getMessageCascade } from '../systems/others/messageCascades';
import { channelIsBlocked, isUsageBanned, fetchMessage } from '../func';
import { Message, PartialMessage } from 'discord.js';

export async function onMessageDelete(message: Message | PartialMessage) {
	const { author } = message;

	if(!author || author.bot || !message.inGuild() || channelIsBlocked(message.channel) || (await isUsageBanned(author)))
		return;

	const { id: messageId, guild, channel } = message;

	const otherMessageId = getMessageCascade(messageId);
	if(!otherMessageId) return;

	const otherMessage = await fetchMessage(otherMessageId, { guild, channel });
	deleteMessageCascade(messageId);
	return otherMessage?.deletable && otherMessage.delete().catch(console.error);
}
