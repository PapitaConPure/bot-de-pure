import Mongoose, { type InferSchemaType } from 'mongoose';

const StatsSchema = new Mongoose.Schema({
	since: {
		type: Number,
		required: true,
	},
	read: {
		type: Number,
		default: 0,
	},
	commands: {
		type: new Mongoose.Schema(
			{
				succeeded: { type: Number, default: 0 },
				failed: { type: Number, default: 0 },
			},
			{ _id: false },
		),
		required: true,
	},
});

const ChannelStatsSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
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


export type StatsSchemaType = InferSchemaType<typeof StatsSchema>;
export type ChannelStatsSchemaType = InferSchemaType<typeof ChannelStatsSchema>;

export const StatsModel = Mongoose.model('Stats', StatsSchema);
export const ChannelStatsModel = Mongoose.model('ChannelStats', ChannelStatsSchema);

export type StatsDocument = InstanceType<typeof StatsModel>;
export type ChannelStatsDocument = InstanceType<typeof ChannelStatsModel>;
