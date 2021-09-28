const Mongoose = require('mongoose');

const PrefixPairSchema = new Mongoose.Schema({
    guildId: { type: String },
    pure: {
        type: Object,
        raw: { type: String },
        regex: { type: RegExp },
        default: { raw: 'p!', regex: /^[Pp]![\n ]*/g }
    },
    drmk: {
        type: Object,
        raw: { type: String },
        regex: { type: RegExp },
        default: { raw: 'd!', regex: /^[Dd]![\n ]*/g }
    }
});

module.exports = Mongoose.model('PrefixPair', PrefixPairSchema);