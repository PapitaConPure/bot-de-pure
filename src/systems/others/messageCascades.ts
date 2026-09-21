import MessageCascades, { type MessageCascadeDocument } from '@/models/messageCascades';

export interface MessageCascadeRecord {
	contentBasedId?: string;
	componentsBasedId?: string;
}

export const messageCascadeMap = {
	contentBased: 'contentBasedId',
	componentsBased: 'componentsBasedId',
} as const satisfies Record<string, keyof MessageCascadeRecord>;
export type MessageCascadePartKey = keyof typeof messageCascadeMap;

const messageCascadesCache: Map<string, MessageCascadeRecord> = new Map();

export function addMessageCascade(
	messageId: string,
	otherMessageId: string,
	part: MessageCascadePartKey,
	expirationDate: Date,
): Promise<MessageCascadeDocument> {
	cacheMessageCascade(messageId, otherMessageId, part);
	return MessageCascades.create({ messageId, otherMessageId, part, expirationDate });
}

export function cacheMessageCascade(
	messageId: string,
	otherMessageId: string,
	part: MessageCascadePartKey,
): void {
	const cached = messageCascadesCache.get(messageId);
	const partKey = messageCascadeMap[part];

	if (!cached) {
		messageCascadesCache.set(messageId, { [partKey]: otherMessageId });
		return;
	}

	if (part === 'contentBased' && cached.contentBasedId != null)
		throw new Error(`Content-based message cascade for ID ${messageId} already exists.`);

	if (part === 'componentsBased' && cached.componentsBasedId != null)
		throw new Error(`Components-based message cascade for ID ${messageId} already exists.`);

	if (cached.contentBasedId != null && cached.contentBasedId === cached.componentsBasedId)
		throw new Error(
			`Duplicated chained message ID for message cascade which originates from ID ${messageId}.`,
		);

	cached[partKey] = otherMessageId;
}

export function getMessageCascade(messageId: string) {
	return messageCascadesCache.get(messageId);
}

export function deleteCachedMessageCascade(messageId: string) {
	return messageCascadesCache.delete(messageId);
}

export function deleteCachedMessageCascadePart(messageId: string, part: MessageCascadePartKey) {
	const cached = messageCascadesCache.get(messageId);
	if (!cached) return false;

	const partKey = messageCascadeMap[part];
	delete cached[partKey];

	if (!Object.keys(cached).length) return messageCascadesCache.delete(messageId);

	return false;
}

export async function deleteExpiredMessageCascades() {
	const cachedMessageIds = [...messageCascadesCache.keys()];

	return MessageCascades.deleteMany({
		$or: [
			{ messageId: { $nin: cachedMessageIds } },
			{ expirationDate: { $lt: new Date(Date.now()) } },
		],
	}).catch(console.error);
}

export async function initializeMessageCascades() {
	const messageCascades = await MessageCascades.find({});
	deleteExpiredMessageCascades();
	setInterval(deleteExpiredMessageCascades, 60 * 60e3);
	await MessageCascades.syncIndexes();
	await MessageCascades.createIndexes();
	messageCascades.forEach(({ messageId, otherMessageId, part }) =>
		cacheMessageCascade(messageId, otherMessageId, part),
	);
}
