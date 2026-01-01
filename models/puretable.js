const Mongoose = require('mongoose');

const pureTableAssets = {
    defaultEmote: '1267233873864032318',
    image: null,
};

const PuretableSchema = new Mongoose.Schema({
    cells: {
        type: Array,
        default: Array(16).fill(null).map(() => Array(16).fill(pureTableAssets.defaultEmote))
    }
});

const AUserSchema = new Mongoose.Schema({
    userId: { type: String },
    last: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    skills: {
        type: Object,
        h: { type: Number },
        v: { type: Number },
        default: {
            h: 1,
            v: 1
        }
    }
});

const pureTableModel = Mongoose.model('Puretable', PuretableSchema);
const aUserModel = Mongoose.model('AUser', AUserSchema);

// eslint-disable-next-line no-unused-vars
function ptm() { return new pureTableModel({}); }
/**@typedef {ReturnType<(typeof ptm)>} PureTableDocument*/

// eslint-disable-next-line no-unused-vars
function aum() { return new aUserModel({}); }
/**@typedef {ReturnType<(typeof aum)>} AUserDocument*/

module.exports = {
    pureTableAssets,
    Puretable: pureTableModel,
    AUser: aUserModel,
};
