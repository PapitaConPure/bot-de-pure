const Mongoose = require('mongoose');

const PrefixPairSchema = new Mongoose.Schema({
    guildId: { type: String },
    pure: {
        raw: { type: String, required: true },
        regex: { type: Mongoose.SchemaTypes.Mixed, required: true },
    },
});

module.exports = Mongoose.model('PrefixPair', PrefixPairSchema);