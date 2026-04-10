import Mongoose from 'mongoose';

/**Describe la configuración de un sistema PureVoice de servidor.*/
const ImgurUserSchema = new Mongoose.Schema({
	userId: { type: String },
    /**ID de cliente de Imgur*/
	clientId: { type: String, required: true },
});

const ImgurUser = Mongoose.model('ImgurUser', ImgurUserSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new ImgurUser({}); }
export type ImgurUserDocument = ReturnType<(typeof m)>;

export default ImgurUser;
