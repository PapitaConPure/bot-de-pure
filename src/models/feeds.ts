import Mongoose, { type InferSchemaType } from 'mongoose';

export const defaultMaxGeneralTags = 20;
export const maxAllowedGeneralTags = 50;

export const defaultMaxSpecialTags = 6;
export const maxAllowedSpecialTags = 12;
export const maxAllowedTotalSpecialTags = 16; //TODO: use this

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
