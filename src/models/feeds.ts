import Mongoose from 'mongoose';

export const FeedConfigSchema = new Mongoose.Schema(
	{
		ids: {
			type: [String],
			default: [],
		},
		tags: {
			type: String,
			required: true,
		},
		faults: {
			type: Number,
			default: 0,
		},
		lastFetchedAt: {
			type: Date,
			default: Date.UTC(1970, 0, 1, 0, 0, 0, 0),
		},
		title: {
			type: String,
		},
		subtitle: {
			type: String,
		},
		maxTags: {
			type: Number,
		},
		cornerIcon: {
			type: String,
		},
		footer: {
			type: String,
		},
	},
	{ _id: false },
);

const FeedConfig = Mongoose.model('FeedConfig', FeedConfigSchema);

function m() {
	return new FeedConfig({});
}
export type FeedDocument = ReturnType<typeof m>;

export default FeedConfig;
