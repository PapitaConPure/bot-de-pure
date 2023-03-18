const Mongoose = require('mongoose');

const UserConfigSchema = new Mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        default: 'es',
        required: true,
    },
    feedTagSuscriptions: {
        type: Map,
        of: [String],
        default: () => { return new Map(); },
        required: true,
    },
    voice: {
        type: Mongoose.SchemaTypes.Mixed,
        default: {},
        required: true,
    },
    flags: {
        type: Array,
        default: [],
        required: true,
    },
    showLevelUp: { type: Boolean, default: true },
    collectMessageData: { type: Boolean, default: true },
});

module.exports = Mongoose.model('UserConfig', UserConfigSchema);