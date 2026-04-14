import Mongoose, { type InferSchemaType } from 'mongoose';

/**Describe la configuración de un sistema PureVoice de servidor.*/
const SauceNAOUserSchema = new Mongoose.Schema({
	userId: { type: String },
	/**ID de cliente de SauceNAO*/
	clientId: { type: String, required: true },
});

export type SauceNAOUserSchemaType = InferSchemaType<typeof SauceNAOUserSchema>;

const SauceNAOUserModel = Mongoose.model('SauceNAOUser', SauceNAOUserSchema);

export type SauceNAOUserDocument = InferSchemaType<typeof SauceNAOUserModel>;

export default SauceNAOUserModel;
