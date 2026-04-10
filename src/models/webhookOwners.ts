import Mongoose from 'mongoose';

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

const WebhookOwner = Mongoose.model('WebhookOwner', WebhookOwnerSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new WebhookOwner({}); }
export type WebhookOwnerDocument = ReturnType<(typeof m)>;

export default WebhookOwner;
