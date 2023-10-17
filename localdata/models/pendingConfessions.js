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

module.exports = Mongoose.model('PendingConfession', PendingConfessionSchema);