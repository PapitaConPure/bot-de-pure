import Mongoose from 'mongoose';

const FeedSchema = new Mongoose.Schema({
	ids: {
		type: [ String ],
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
		required: false,
	},
	subtitle: {
		type: String,
		required: false,
	},
	maxTags: {
		type: Number,
		required: false,
	},
	cornerIcon: {
		type: String,
		required: false,
	},
	footer: {
		type: String,
		required: false,
	},
});

const Feed = Mongoose.model('Feed', FeedSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new Feed({}); }
export type FeedDocument = ReturnType<(typeof m)>;

export default Feed;
