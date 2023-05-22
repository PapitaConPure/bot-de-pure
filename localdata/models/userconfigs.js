const Mongoose = require('mongoose');

const UserConfigSchema = new Mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    prc: { type: Number, default: 0 },
    lastCultivate: { type: Number, default: 0 },
    
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
    banned: { type: Boolean, default: false },
});

module.exports = Mongoose.model('UserConfig', UserConfigSchema);