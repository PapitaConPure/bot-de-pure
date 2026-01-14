import { Schema, model } from 'mongoose';

export const pureTableAssets = {
    defaultEmote: '1267233873864032318',
    image: null,
};

const PuretableSchema = new Schema({
    cells: {
        type: [[String]],
        default: Array(16).fill(null).map(() => Array(16).fill(pureTableAssets.defaultEmote))
    },
});

const AUserSkillSubschema = new Schema({
    hline: { type: Number, default: 1 },
    vline: { type: Number, default: 1 },
    x: { type: Number, default: 1 },
    square: { type: Number },
    circle: { type: Number },
    diamond: { type: Number },
    heart: { type: Number },
    tetris: { type: Number },
    p: { type: Number },
    exclamation: { type: Number },
    a: { type: Number },
    ultimate: { type: Number },
});

const AUserSchema = new Schema({
    userId: { type: String },
    last: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    skills: AUserSkillSubschema,
});

export const PureTable = model('PureTable', PuretableSchema);
export const AnarchyUser = model('AUser', AUserSchema);

function ptm() { return new PureTable({}); }
export type PureTableDocument = ReturnType<(typeof ptm)>;

function aum() { return new AnarchyUser({}); }
export type AUserDocument = ReturnType<(typeof aum)>;
