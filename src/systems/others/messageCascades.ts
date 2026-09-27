import { minutesToMilliseconds } from 'date-fns';
import MessageCascades, { type MessageCascadeDocument } from '@/models/messageCascades';
import Logger from '@/utils/logs';

const { info, warn, error } = Logger('WARN', 'MessageCascades');

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

export async function addMessageCascade(
	messageId: string,
	otherMessageId: string,
	part: MessageCascadePartKey,
	expirationDate: Date,
): Promise<MessageCascadeDocument> {
	validateCacheMessageCascade(messageId, otherMessageId, part);

	const document = await MessageCascades.create({
		messageId,
		otherMessageId,
		part,
		expirationDate,
	});

	cacheMessageCascade(messageId, otherMessageId, part, { skipValidation: true });
	return document;
}

interface CacheMessageCascadeOptions {
	skipValidation?: boolean;
}

export function cacheMessageCascade(
	messageId: string,
	otherMessageId: string,
	part: MessageCascadePartKey,
	options: CacheMessageCascadeOptions = {},
): void {
	const { skipValidation = false } = options;

	const { cached, partKey } = skipValidation
		? (() => {
				const cached = messageCascadesCache.get(messageId);
				const partKey = messageCascadeMap[part];
				return { cached, partKey };
			})()
		: validateCacheMessageCascade(messageId, otherMessageId, part);

	if (!cached) {
		messageCascadesCache.set(messageId, { [partKey]: otherMessageId });
		return;
	}

	cached[partKey] = otherMessageId;
}

function validateCacheMessageCascade(
	messageId: string,
	otherMessageId: string,
	part: MessageCascadePartKey,
): { cached: MessageCascadeRecord | undefined; partKey: string } {
	const cached = messageCascadesCache.get(messageId);
	const partKey = messageCascadeMap[part];

	if (!cached) return { cached, partKey };

	if (cached[partKey] != null) {
		const partName = part === 'contentBased' ? 'Content-based' : 'Components-based';
		throw new Error(`${partName} message cascade for ID ${messageId} already exists.`);
	}

	const otherPart: MessageCascadePartKey =
		part === 'contentBased' ? 'componentsBased' : 'contentBased';
	const otherPartKey = messageCascadeMap[otherPart];
	if (cached[otherPartKey] != null && cached[otherPartKey] === otherMessageId)
		throw new Error(
			`Content and component message cascade parts for ID ${messageId} cannot share the same ID.`,
		);

	return { cached, partKey };
}

export function getMessageCascade(messageId: string): MessageCascadeRecord | undefined {
	return messageCascadesCache.get(messageId);
}

export async function deleteMessageCascade(messageId: string): Promise<boolean> {
	await MessageCascades.deleteMany({ messageId });
	return messageCascadesCache.delete(messageId);
}

/**
 *
 * @param messageId
 * @param part
 * @returns `true` if all records/fields associated to `messageId` were deleted. `false` otherwise.
 */
export async function deleteMessageCascadePart(
	messageId: string,
	part: MessageCascadePartKey,
): Promise<boolean> {
	const partKey = messageCascadeMap[part];
	if (!partKey) throw new Error(`Invalid message cascade part: "${part}".`);

	await MessageCascades.deleteOne({ messageId, part });

	const cached = messageCascadesCache.get(messageId);
	if (!cached) return false;

	delete cached[partKey];

	if (!Object.keys(cached).length) return messageCascadesCache.delete(messageId);

	return false;
}

export async function deleteExpiredMessageCascades() {
	return MessageCascades.deleteMany({
		expirationDate: { $lt: new Date() },
	}).catch(console.error);
}

export async function initializeMessageCascades() {
	await MessageCascades.syncIndexes();
	await MessageCascades.createIndexes();

	await deleteExpiredMessageCascades();
	setInterval(deleteExpiredMessageCascades, minutesToMilliseconds(30));

	const messageCascades = await MessageCascades.find({});
	try {
		messageCascades.forEach(({ messageId, otherMessageId, part }) =>
			cacheMessageCascade(messageId, otherMessageId, part),
		);
		info('Message cascades initialization successful.');
	} catch (err) {
		error(err);
		warn('Message cascades initialization failed. Cache may be incomplete.');
	}
}
