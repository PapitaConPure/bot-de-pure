const Mongoose = require('mongoose');

const HouraiSchema = new Mongoose.Schema({
    configs: { type: Object, default: {} },
    userInfractions: { type: Object, default: {} },
    customRoles: { type: Object, default: {} },
    mentionRoles: {
        type: Object,
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

module.exports = Mongoose.model('Hourai', HouraiSchema);