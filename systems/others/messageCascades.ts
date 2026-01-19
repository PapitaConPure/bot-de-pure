import MessageCascades from '../../models/messageCascades';

const messageCascadesCache: Map<string, string> = new Map();

export function addMessageCascade(messageId: string, otherMessageId: string, expirationDate: Date) {
	if(messageCascadesCache.has(messageId))
		throw Error(`Message cascade from id ${messageId} already exists.`);

	messageCascadesCache.set(messageId, otherMessageId);
	return (MessageCascades.create({ messageId, otherMessageId, expirationDate }));
}

export function cacheMessageCascade(messageId: string, otherMessageId: string) {
	messageCascadesCache.set(messageId, otherMessageId);
}

export function getMessageCascade(messageId: string) {
	return messageCascadesCache.get(messageId);
}

export function deleteMessageCascade(messageId: string) {
	return messageCascadesCache.delete(messageId);
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

export async function initializeMessageCascades() {
	const messageCascades = await MessageCascades.find({});
	deleteExpiredMessageCascades();
	setInterval(deleteExpiredMessageCascades, 60 * 60e3);
	await MessageCascades.syncIndexes();
	await MessageCascades.createIndexes();
	messageCascades.forEach(({ messageId, otherMessageId }) => cacheMessageCascade(messageId, otherMessageId));
}
