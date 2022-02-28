const Mongoose = require('mongoose');

/** Describe la configuración de un servidor. */
const QueueSchema = new Mongoose.Schema({
    queueId: { type: String },
    content: { type: Array, default: [] },
});

module.exports = Mongoose.model('Queue', QueueSchema);