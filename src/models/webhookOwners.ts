import Mongoose, { type InferSchemaType } from 'mongoose';

const WebhookOwnerSchema = new Mongoose.Schema({
	messageId: {
		type: String,
		required: true,
	},
	userId: {
		type: String,
		required: true,
	},
	expirationDate: {
		type: Number,
		required: true,
	},
});

export type WebhookOwnerSchemaType = InferSchemaType<typeof WebhookOwnerSchema>;

const WebhookOwnerModel = Mongoose.model('WebhookOwner', WebhookOwnerSchema);

export type WebhookOwnerDocument = InstanceType<typeof WebhookOwnerModel>;

export default WebhookOwnerModel;
