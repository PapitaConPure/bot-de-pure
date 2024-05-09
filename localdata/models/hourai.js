const Mongoose = require('mongoose');

/** Describe la configuración de Saki Scans (Hourai Doll) */
const HouraiSchema = new Mongoose.Schema({
    configs: { type: Object, default: {} },
    /** Infracciones por uso de bots fuera de botposting */
    userInfractions: { type: Object, default: {} },
    customRoles: { type: Object, default: {} },
    mentionRoles: {
        type: Object,
        GAMES: {
            type: Object,
            functionName: 'selectGame',
            rolePool: [],
            exclusive: false,
            required: true,
        },
        DRINKS: {
            functionName: 'selectDrink',
            rolePool: [],
            exclusive: false,
            required: true,
        },
        FAITH: {
            functionName: 'selectReligion',
            rolePool: [],
            exclusive: true,
            required: true,
        },
        default: {
            GAMES: {
                functionName: 'selectGame',
                rolePool: [],
                exclusive: false,
            },
            DRINKS: {
                functionName: 'selectDrink',
                rolePool: [],
                exclusive: false,
            },
            FAITH: {
                functionName: 'selectReligion',
                rolePool: [],
                exclusive: true,
            },
        },
    },
});

const model = Mongoose.model('Hourai', HouraiSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} HouraiDocument*/

module.exports = model;
