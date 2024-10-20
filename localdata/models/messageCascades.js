const Mongoose = require('mongoose');

const MessageCascadeSchema = new Mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true,
    },
    otherMessageId: {
        type: String,
        required: true,
    },
    expirationDate: {
        type: Date,
        default: () => new Date(Date.now() + 4 * 60 * 60e3),
    },
});

const model = Mongoose.model('MessageCascade', MessageCascadeSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} MessageCascadeDocument*/

module.exports = model;
