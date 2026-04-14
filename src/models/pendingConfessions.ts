import Mongoose, { type InferSchemaType } from 'mongoose';

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

export type PendingConfessionSchemaType = InferSchemaType<typeof PendingConfessionSchema>;

const PendingConfessionModel = Mongoose.model('PendingConfession', PendingConfessionSchema);

export type PendingConfessionDocument = InstanceType<typeof PendingConfessionModel>;

export default PendingConfessionModel;
