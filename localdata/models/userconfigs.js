const Mongoose = require('mongoose');

const UserConfigSchema = new Mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    
    prc: {
        type: Number,
        default: 0
    },
    lastCultivate: {
        type: Number,
        default: 0
    },
    reactionsReceivedToday: {
        type: Number,
        default: 0,
    },
    highlightedToday: {
        type: Boolean,
        default: false,
    },
    messagesToday: {
        type: Number,
        default: 0,
    },
    lastDateReceived: {
        type: Date,
        default: () => new Date(0),
    },
    
    language: {
        type: String,
        enum: [ 'es', 'en', 'ja' ],
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
        ping: {
            type: String,
            enum: [ 'always', 'onCreate', 'never' ],
            default: 'always',
        },
        autoname: {
            type: String,
            default: '',
        },
        autoemoji: {
            type: String,
            default: '',
        },
        killDelay: {
            type: Number,
            default: 0,
        },
    },
    flags: {
        type: Array,
        default: [],
        required: true,
    },
    pixivConverter: {
        type: String,
        enum: [ '', 'phixiv', 'webhook' ],
        default: 'phixiv',
    },
    twitterPrefix: {
        type: String,
        enum: [ '', 'vx', 'fx' ],
        default: 'vx',
    },
    showLevelUp: {
        type: Boolean,
        default: true
    },
    collectMessageData: {
        type: Boolean,
        default: true
    },
    banned: {
        type: Boolean,
        default: false
    },
});

const model = Mongoose.model('UserConfig', UserConfigSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} UserConfigDocument*/

module.exports = model;
