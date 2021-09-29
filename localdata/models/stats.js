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

module.exports = {
    Stats: Mongoose.model('Stats', StatsSchema),
    ChannelStats: Mongoose.model('ChannelStats', ChannelStatsSchema)
};