const Mongoose = require('mongoose');

const StatsSchema = new Mongoose.Schema({
    since: { type: Number },
    read: { type: Number, default: 0 },
    commands: {
        type: Object,
        succeeded: { type: Number },
        failed: { type: Number },
        default: {
            succeeded: 0,
            failed: 0
        }
    }
});

const ChannelStatsSchema = new Mongoose.Schema({
    guildId: { type: String },
    channelId: { type: String },
    cnt: { type: Number, default: 0 },
    sub: { type: Object, default: {} }
});

const model = Mongoose.model('Stats', StatsSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} StatsDocument*/

module.exports = {
    Stats: model,
    ChannelStats: Mongoose.model('ChannelStats', ChannelStatsSchema)
};
