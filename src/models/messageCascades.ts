import Mongoose, { type InferSchemaType } from 'mongoose';

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

export type MessageCascadeSchemaType = InferSchemaType<typeof MessageCascadeSchema>;

const MessageCascadeModel = Mongoose.model('MessageCascade', MessageCascadeSchema);

export type MessageCascadeDocument = InstanceType<typeof MessageCascadeModel>;

export default MessageCascadeModel;
