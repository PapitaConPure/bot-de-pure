const Mongoose = require('mongoose');

const WebhookOwnerSchema = new Mongoose.Schema({
    messageId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    expirationDate: {
        type: Number,
        required: true,
    },
});

const model = Mongoose.model('WebhookOwner', WebhookOwnerSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} WebhookOwnerDocument*/

module.exports = model;
