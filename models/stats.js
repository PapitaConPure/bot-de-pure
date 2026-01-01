const Mongoose = require('mongoose');

const StatsSchema = new Mongoose.Schema({
    since: {
        type: Number,
        required: true,
    },
    read: {
        type: Number,
        default: 0
    },
    commands: {
        type: Object,
        succeeded: { type: Number },
        failed: { type: Number },
        default: {
            succeeded: 0,
            failed: 0
        },
    }
});

const ChannelStatsSchema = new Mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true,
    },
    cnt: {
        type: Number,
        default: 0,
    },
    sub: {
        type: Object,
        default: {},
    },
});

const model = Mongoose.model('Stats', StatsSchema);
const channelModel = Mongoose.model('ChannelStats', ChannelStatsSchema);

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} StatsDocument*/

// eslint-disable-next-line no-unused-vars
function cm() { return new channelModel({}); }
/**@typedef {ReturnType<(typeof cm)>} ChannelStatsDocument*/

module.exports = {
    Stats: model,
    ChannelStats: channelModel
};
