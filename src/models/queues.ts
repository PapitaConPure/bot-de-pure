import Mongoose from 'mongoose';

/** Describe la configuración de un servidor. */
const QueueSchema = new Mongoose.Schema({
	queueId: { type: String },
	content: { type: Array, of: Number, default: [] },
});

export const QueueModel = Mongoose.model('Queue', QueueSchema);

interface QueueQuery {
	queueId: string;
}

interface QueueGenerationOptions {
	length: number;
	mapFn?: (v: number, k: number) => number;
	sort: Sort;
}

type QueueItem = number;

type SortFn = (a: number, b: number) => number;

type Sort = 'NONE' | 'REVERSE' | 'ABC' | 'ABC_R' | 'VALUE' | 'VALUE_R' | 'RANDOM' | SortFn;

/**
 * Genera una nueva Queue sin guardarla en la base de datos.
 * Es probable que prefieras usar getQueueItem antes que solamente esta función
 */
export const generateQueue = ({
	length = 1,
	mapFn = (_, k) => k,
	sort = 'NONE',
}: QueueGenerationOptions): QueueItem[] => {
	length = Math.max(1, length);

	if (typeof mapFn !== 'function') return Array(length).fill(null);

	const queue = Array.from({ length }, mapFn);

	switch (sort) {
		case 'NONE':
			return queue;
		case 'REVERSE':
			return queue.reverse();
		case 'ABC':
			return queue.sort();
		case 'ABC_R':
			return queue.sort().reverse();
		case 'VALUE':
			return queue.sort((a, b) => a - b);
		case 'VALUE_R':
			return queue.sort((a, b) => b - a);
		case 'RANDOM':
			return queue.sort(() => Math.random() - 0.5);
		default:
			return typeof sort === 'function' ? queue.sort(sort) : queue;
	}
};

/**@description Guarda una Queue con el Query especificado*/
export const saveQueue = async (queueQuery) => {
	const queue = (await QueueModel.findOne(queueQuery)) || new QueueModel(queueQuery);
	return queue.save();
};

/**
 * @description
 * Sustrae el primer elemento de la Queue especificada, lo devuelve y guarda los cambios en la base de datos.
 * Si la Queue no existe o está vacía, se genera una nueva basada en las opciones proporcionadas o valores de generación por defecto
 */
export const getQueueItem = async (
	subtractOptions: QueueQuery & QueueGenerationOptions,
): Promise<QueueItem> => {
	const { queueId, ...queueGenOptions } = subtractOptions;
	const queueQuery = { queueId };
	const queue = (await QueueModel.findOne(queueQuery)) || new QueueModel(queueQuery);
	if (!queue.content?.length) queue.content = generateQueue(queueGenOptions);

	const item = queue.content.shift();
	queue.markModified('content');
	await queue.save();

	return item;
};
