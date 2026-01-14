import Mongoose from 'mongoose';

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

export const Stats = Mongoose.model('Stats', StatsSchema);

function m() { return new Stats({}); }
export type StatsDocument = ReturnType<(typeof m)>;

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

export const ChannelStats = Mongoose.model('ChannelStats', ChannelStatsSchema);

function cm() { return new ChannelStats({}); }
export type ChannelStatsDocument = ReturnType<(typeof cm)>;
