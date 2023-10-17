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

module.exports = Mongoose.model('ConfessionSystem', ConfessionSystemSchema);