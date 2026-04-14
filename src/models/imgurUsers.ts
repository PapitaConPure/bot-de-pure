import Mongoose, { type InferSchemaType } from 'mongoose';

/**Describe la configuración de un sistema PureVoice de servidor.*/
const ImgurUserSchema = new Mongoose.Schema({
	userId: { type: String },
	/**ID de cliente de Imgur*/
	clientId: { type: String, required: true },
});

export type ImgurUserSchemaType = InferSchemaType<typeof ImgurUserSchema>;

const ImgurUserModel = Mongoose.model('ImgurUser', ImgurUserSchema);

export type ImgurUserDocument = InstanceType<typeof ImgurUserModel>;

export default ImgurUserModel;
