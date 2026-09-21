import type { Message, PartialMessage } from 'discord.js';
import { channelIsBlocked, fetchMessage, isUsageBanned } from '@/utils/discord';
import { deleteCachedMessageCascade, getMessageCascade } from '../systems/others/messageCascades';

export async function onMessageDelete(message: Message | PartialMessage) {
	const { author } = message;

	if (
		!author
		|| author.bot
		|| !message.inGuild()
		|| channelIsBlocked(message.channel)
		|| (await isUsageBanned(author))
	)
		return;

	const { id: messageId, guild, channel } = message;

	const cascade = getMessageCascade(messageId);
	deleteCachedMessageCascade(messageId);
	if (cascade == null) return;

	const deleteMessageById = async (otherMessageId: string) => {
		const otherMessage = await fetchMessage(otherMessageId, { guild, channel });
		return otherMessage?.deletable && otherMessage.delete().catch(console.error);
	};

	return Promise.all([
		cascade.contentBasedId != null && deleteMessageById(cascade.contentBasedId),
		cascade.componentsBasedId != null && deleteMessageById(cascade.componentsBasedId),
	]);
}
