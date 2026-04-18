import Mongoose, { type InferSchemaType } from 'mongoose';

export const FeedConfigSchema = new Mongoose.Schema({
	channelId: {
		type: String,
		required: true,
		unique: true,
	},
	guildId: {
		type: String,
		required: true,
	},
	searchTags: {
		type: String,
		required: true,
	},
	faults: {
		type: Number,
		default: 0,
	},
	lastFetchedAt: {
		type: Date,
		required: true,
	},
	title: {
		type: String,
	},
	subtitle: {
		type: String,
	},
	maxGeneralTags: {
		type: Number,
	},
	icon: {
		type: String,
	},
	footerText: {
		type: String,
	},
});

export type FeedSchemaType = InferSchemaType<typeof FeedConfigSchema>;

export const FeedConfigModel = Mongoose.model('FeedConfig', FeedConfigSchema);

export type FeedDocument = InstanceType<typeof FeedConfigModel>;

export default FeedConfigModel;
