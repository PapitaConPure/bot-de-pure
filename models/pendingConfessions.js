const Mongoose = require('mongoose');

const PendingConfessionSchema = new Mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    anonymous: {
        type: Boolean,
        default: true,
    },
});

const model = Mongoose.model('PendingConfession', PendingConfessionSchema);

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} PendingConfessionDocument*/

module.exports = model;
