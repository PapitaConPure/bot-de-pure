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

module.exports = Mongoose.model('WebhookOwner', WebhookOwnerSchema);