const Mongoose = require('mongoose');

const PrefixPairSchema = new Mongoose.Schema({
    guildId: { type: String },
    pure: {
        raw: { type: String, required: true },
        regex: { type: Mongoose.SchemaTypes.Mixed, required: true },
    },
});

const model = Mongoose.model('PrefixPair', PrefixPairSchema);

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} PrefixPairDocument*/

module.exports = model;
