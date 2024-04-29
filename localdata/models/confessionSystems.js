const Mongoose = require('mongoose');

const ConfessionSystemSchema = new Mongoose.Schema({
    guildId: {
        type: String,
        required: true,
    },
    logChannelId: {
        type: String,
        required: true,
    },
    confessionsChannelId: {
        type: String,
        required: true,
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
