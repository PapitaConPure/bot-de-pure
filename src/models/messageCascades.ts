import Mongoose, { type InferSchemaType } from 'mongoose';
import type { MessageCascadePartKey } from '@/systems/others/messageCascades';

const MessageCascadeSchema = new Mongoose.Schema({
	messageId: {
		type: String,
		required: true,
	},
	otherMessageId: {
		type: String,
		required: true,
	},
	part: {
		type: String,
		enum: ['contentBased', 'componentsBased'] satisfies readonly MessageCascadePartKey[],
		required: true,
	},
	expirationDate: {
		type: Date,
		default: () => new Date(Date.now() + 4 * 60 * 60e3),
	},
});
MessageCascadeSchema.index({ messageId: 1, otherMessageId: 1 }, { unique: true });

export type MessageCascadeSchemaType = InferSchemaType<typeof MessageCascadeSchema>;

const MessageCascadeModel = Mongoose.model('MessageCascade', MessageCascadeSchema);

export type MessageCascadeDocument = InstanceType<typeof MessageCascadeModel>;

export default MessageCascadeModel;
