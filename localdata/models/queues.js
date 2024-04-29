const Mongoose = require('mongoose');

/** Describe la configuración de un servidor. */
const QueueSchema = new Mongoose.Schema({
    queueId: { type: String },
    content: { type: Array, default: [] },
});
const QueueModel = Mongoose.model('Queue', QueueSchema);

/**
 * @typedef {{ queueId: String }} QueueQuery
 * @typedef {{ length: Number, mapFn: (v, k) => *, sort: Sort }} QueueGenerationOptions
 * @typedef {*} QueueItem
 */

/**
 * Genera una nueva Queue sin guardarla en la base de datos.
 * Es probable que prefieras usar getQueueItem antes que solamente esta función
 * @typedef {(a: *, b: *) => *} SortFn
 * @typedef {'NONE'|'REVERSE'|'ABC'|'ABC_R'|'VALUE'|'VALUE_R'|'RANDOM'|SortFn} Sort
 * @param {QueueGenerationOptions} options Largo, mapeado y ordenamiento de la Queue
 * @returns {Array<QueueItem>} Queue generada
 */
const generateQueue = ({ length = 0, mapFn = (v, k) => k, sort = 'NONE' }) => {
    if(length <= 0) return [];
    if(typeof mapFn !== 'function') return Array(length).fill(null);

    const queue = Array.from({ length }, mapFn);
    
    switch(sort) {
        case 'NONE':    return queue;
        case 'REVERSE': return queue.reverse();
        case 'ABC':     return queue.sort();
        case 'ABC_R':   return queue.sort().reverse();
        case 'VALUE':   return queue.sort((a, b) => a - b);
        case 'VALUE_R': return queue.sort((a, b) => b - a);
        case 'RANDOM':  return queue.sort(() => Math.random() - 0.5);
        default:        return (typeof sort === 'function') ? queue.sort(sort) : queue;
    }
};

/**
 * Guarda una Queue con el Query especificado
 * @param {QueueQuery} queueQuery 
 * @returns
 */
const saveQueue = async (queueQuery) => {
    const queue = (await QueueModel.findOne(queueQuery)) || new QueueModel(queueQuery);
    return queue.save();
};

/**
 * Sustrae el primer elemento de la Queue especificada, lo devuelve y guarda los cambios en la base de datos.
 * Si la Queue no existe o está vacía, se genera una nueva basada en las opciones proporcionadas o valores de generación por defecto
 * @param {QueueQuery & QueueGenerationOptions} subtractOptions
 * @returns {Promise<QueueItem>}
 */
const getQueueItem = async (subtractOptions) => {
    const { queueId, ...queueGenOptions } = subtractOptions;
    const queueQuery = { queueId };
    const queue = (await QueueModel.findOne(queueQuery)) || new QueueModel(queueQuery);
    if(!queue.content?.length) {
        if(!queueGenOptions.length) return;
        queue.content = generateQueue(queueGenOptions);
    }
    
    const item = queue.content.shift();
    queue.markModified('content');
    await queue.save();

    return item;
};

module.exports = {
    QueueModel,
    generateQueue,
    saveQueue,
    getQueueItem,
};