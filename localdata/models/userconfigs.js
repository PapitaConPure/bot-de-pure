const Mongoose = require('mongoose');

const UserConfigSchema = new Mongoose.Schema({
    userId: { type: String },
    language: { type: String, default: 'es' },
    feedTagSuscriptions: {
        type: Map,
        of: [String],
    },
    voice: { type: Mongoose.SchemaTypes.Mixed, default: {} },
    flags: { type: Array, default: [] },
    showLevelUp: { type: Boolean, default: true },
    collectMessageData: { type: Boolean, default: true },
});

module.exports = Mongoose.model('UserConfig', UserConfigSchema);