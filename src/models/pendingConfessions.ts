import Mongoose, { type InferSchemaType } from 'mongoose';
import { MIMETypes } from '@/utils/misc';

const PendingConfessionAttachmentSchema = new Mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		contentType: {
			type: String,
			enum: Object.values(MIMETypes),
		},
	},
	{ _id: false },
);

export type PendingConfessionAttachmentSchemaType = InferSchemaType<
	typeof PendingConfessionAttachmentSchema
>;

export const PendingConfessionAttachmentModel = Mongoose.model(
	'PendingConfessionAttachment',
	PendingConfessionAttachmentSchema,
);

export type PendingConfessionAttachmentDocument = InstanceType<
	typeof PendingConfessionAttachmentModel
>;

const PendingConfessionSchema = new Mongoose.Schema({
	id: {
		type: String,
		required: true,
	},
	channelId: {
		type: String,
		required: true,
	},
	pseudonym: {
		type: String,
	},
	content: {
		type: String,
		required: true,
	},
	attachments: {
		type: [PendingConfessionAttachmentSchema],
	},
	anonymous: {
		type: Boolean,
		default: true,
	},
});

export type PendingConfessionSchemaType = InferSchemaType<typeof PendingConfessionSchema>;

const PendingConfessionModel = Mongoose.model('PendingConfession', PendingConfessionSchema);

export type PendingConfessionDocument = InstanceType<typeof PendingConfessionModel>;

export default PendingConfessionModel;
