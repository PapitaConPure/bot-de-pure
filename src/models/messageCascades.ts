import Mongoose from 'mongoose';

const MessageCascadeSchema = new Mongoose.Schema({
	messageId: {
		type: String,
		required: true,
		unique: true,
	},
	otherMessageId: {
		type: String,
		required: true,
	},
	expirationDate: {
		type: Date,
		default: () => new Date(Date.now() + 4 * 60 * 60e3),
	},
});

const MessageCascade = Mongoose.model('MessageCascade', MessageCascadeSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new MessageCascade({}); }
export type MessageCascadeDocument = ReturnType<(typeof m)>;

export default MessageCascade;
