const Mongoose = require('mongoose');
const global = require('../config.json');

const PrefixPairSchema = new Mongoose.Schema({
    guildId: { type: String },
    pure: {
        type: Object,
        raw: { type: String },
        regex: { type: RegExp },
        default: { raw: 'p!', regex: /^p![\n ]*/g }
    },
    drmk: {
        type: Object,
        raw: { type: String },
        regex: { type: RegExp },
        default: { raw: 'd!', regex: /^d![\n ]*/g }
    }
});

module.exports = Mongoose.model('PrefixPair', PrefixPairSchema);