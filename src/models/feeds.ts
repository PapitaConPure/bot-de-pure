import Mongoose, { type InferSchemaType } from 'mongoose';

export const defaultMaxGeneralTags = 16;
export const maxAllowedGeneralTags = 50;

export const defaultMaxSpecialTags = 3;
export const maxAllowedSpecialTags = 6;
export const maxAllowedTotalSpecialTags = 12;

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
	maxArtistTags: {
		type: Number,
	},
	maxCharacterTags: {
		type: Number,
	},
	maxCopyrightTags: {
		type: Number,
	},
	omitRedundantTags: {
		type: Boolean,
		default: true,
	},
	icon: {
		type: String,
	},
});

export type FeedSchemaType = InferSchemaType<typeof FeedConfigSchema>;

export const FeedConfigModel = Mongoose.model('FeedConfig', FeedConfigSchema);

export type FeedDocument = InstanceType<typeof FeedConfigModel>;

export default FeedConfigModel;
