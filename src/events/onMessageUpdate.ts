import { addHours } from 'date-fns';
import {
	type Message,
	MessageFlags,
	type OmitPartialGroupDMChannel,
	type PartialMessage,
} from 'discord.js';
import type { ContentfulConverterPayload } from 'types/converters';
import WebhookOwnerModel from '@/models/webhookOwners';
import { gelbooruConverter } from '@/systems/converters/boorutato';
import { mergeConverterPayloads, processConverter } from '@/systems/converters/pipeline';
import { twitterConverter } from '@/systems/converters/pureet';
import { pixivConverter } from '@/systems/converters/purepix';
import { instagramConverter } from '@/systems/converters/purestagram';
import {
	addMessageCascade,
	deleteCachedMessageCascadePart,
	getMessageCascade,
	type MessageCascadePartKey,
	type MessageCascadeRecord,
	messageCascadeMap,
} from '@/systems/others/messageCascades';
import { channelIsBlocked, fetchMessage, suppressEmbedsAsSoonAsPossible } from '@/utils/discord';
import { addAgentMessageOwner } from '@/utils/discordagent';
import { fetchUserCache } from '@/utils/usercache';

export async function onMessageUpdate(
	oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage<boolean>>,
	message: OmitPartialGroupDMChannel<Message<boolean>>,
) {
	if (oldMessage.content === message.content) return;

	const { author } = message;

	if (author.bot || !message.inGuild() || channelIsBlocked(message.channel)) return;

	const userCache = await fetchUserCache(author);
	if (userCache == null || userCache.banned) return;

	const { id: messageId } = message;

	const convertersPayload = await mergeConverterPayloads([
		processConverter(pixivConverter, message, userCache.pixivConverter),
		processConverter(twitterConverter, message, userCache.twitterPrefix),
		processConverter(gelbooruConverter, message, userCache.gelbooruConverter),
		processConverter(instagramConverter, message, userCache.instagramConverter),
	]);

	if (!convertersPayload.contentful) return;

	const cascade = getMessageCascade(messageId) ?? {};
	console.log({ convertersPayload, cascade });

	if (cascade.contentBasedId == null) addCascadePart(message, convertersPayload, 'contentBased');
	else editOrDeleteExistingCascadePart(message, convertersPayload, cascade, 'contentBased');

	if (cascade.componentsBasedId == null)
		addCascadePart(message, convertersPayload, 'componentsBased');
	else editOrDeleteExistingCascadePart(message, convertersPayload, cascade, 'componentsBased');
}

async function addCascadePart(
	message: Message<true>,
	convertersPayload: ContentfulConverterPayload,
	part: MessageCascadePartKey,
) {
	const { content, ...restOfPayload } = convertersPayload;
	const [contentSent, componentsSent] = await Promise.all([
		part === 'contentBased' && content ? message.reply({ content }) : undefined,
		part === 'componentsBased' && restOfPayload.components?.length
			? message.reply(restOfPayload)
			: undefined,
		suppressEmbedsAsSoonAsPossible(message),
	]);

	const expiresAt = addHours(message.createdAt, 4);

	if (contentSent != null)
		await Promise.all([
			addAgentMessageOwner(contentSent, message.author.id),
			addMessageCascade(message.id, contentSent.id, 'contentBased', expiresAt),
		]);

	if (componentsSent != null)
		await Promise.all([
			addAgentMessageOwner(componentsSent, message.author.id),
			addMessageCascade(message.id, componentsSent.id, 'componentsBased', expiresAt),
		]);
}

async function editOrDeleteExistingCascadePart(
	message: Message<true>,
	convertersPayload: ContentfulConverterPayload,
	cascade: MessageCascadeRecord,
	part: MessageCascadePartKey,
) {
	const partKey = messageCascadeMap[part];
	const otherMessageId = cascade[partKey];
	if (otherMessageId == null) return;

	const { guild, channel } = message;
	const otherMessage = await fetchMessage(otherMessageId, { guild, channel });

	if (
		(part === 'contentBased' && !convertersPayload.content)
		|| (part === 'componentsBased' && !convertersPayload.components?.length)
	) {
		deleteCachedMessageCascadePart(message.id, part);
		await Promise.all([
			WebhookOwnerModel.deleteOne({ messageId: otherMessageId, userId: message.author.id }),
			otherMessage?.deletable && otherMessage.delete().catch(console.error),
		]);
		return;
	}

	if (!otherMessage?.editable) {
		deleteCachedMessageCascadePart(message.id, part);
		await WebhookOwnerModel.deleteOne({ messageId: otherMessageId, userId: message.author.id });
		return;
	}

	const isComponentsV2 = otherMessage?.flags.has(MessageFlags.IsComponentsV2);

	await Promise.all([
		isComponentsV2
			? otherMessage.edit({ components: convertersPayload.components }).catch(console.error)
			: otherMessage.edit({
					content: convertersPayload.content,
					components: [],
				}),
		suppressEmbedsAsSoonAsPossible(message),
	]);
}
