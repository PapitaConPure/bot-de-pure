const Mongoose = require('mongoose');
const { makeStringIdValidator } = require('./modelUtils');

const ConfessionSystemSchema = new Mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        validator: makeStringIdValidator('Se esperaba una ID de servidor que no estuviera vacía'),
    },
    logChannelId: {
        type: String,
        required: true,
        validator: makeStringIdValidator('Se esperaba una ID de canal de auditoría que no estuviera vacía'),
    },
    confessionsChannelId: {
        type: String,
        required: true,
        validator: makeStringIdValidator('Se esperaba una ID de canal de confesiones que no estuviera vacía'),
    },
    pending: {
        type: Array,
        default: [],
    }
});

const model = Mongoose.model('ConfessionSystem', ConfessionSystemSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} ConfessionSystemDocument*/

module.exports = model;
