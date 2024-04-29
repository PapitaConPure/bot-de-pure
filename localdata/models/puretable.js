const Mongoose = require('mongoose');

const defaultEmote = '828736342372253697';

const PuretableSchema = new Mongoose.Schema({
    cells: {
        type: Array,
        default: Array(16).fill(null).map(() => Array(16).fill(defaultEmote))
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

function ptm() { return new pureTableModel({}); }
/**@typedef {ReturnType<(typeof ptm)>} PureTableDocument*/

function aum() { return new aUserModel({}); }
/**@typedef {ReturnType<(typeof aum)>} AUserDocument*/

module.exports = {
    defaultEmote,
    Puretable: pureTableModel,
    AUser: aUserModel,
};
