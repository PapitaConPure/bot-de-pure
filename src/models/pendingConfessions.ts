import Mongoose from 'mongoose';

const PendingConfessionSchema = new Mongoose.Schema({
	id: {
		type: String,
		required: true,
	},
	channelId: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	anonymous: {
		type: Boolean,
		default: true,
	},
});

const PendingConfession = Mongoose.model('PendingConfession', PendingConfessionSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new PendingConfession({}); }
export type PendingConfessionDocument = ReturnType<(typeof m)>;

export default PendingConfession;
