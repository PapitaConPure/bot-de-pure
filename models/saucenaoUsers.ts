import Mongoose from 'mongoose';

/**Describe la configuración de un sistema PureVoice de servidor.*/
const SauceNAOUserSchema = new Mongoose.Schema({
	userId: { type: String },
    /**ID de cliente de SauceNAO*/
	clientId: { type: String, required: true },
});

const SauceNAOUser = Mongoose.model('SauceNAOUser', SauceNAOUserSchema);

function m() { return new SauceNAOUser({}); }
export type SauceNAOUserDocument = ReturnType<(typeof m)>;

export default SauceNAOUser;
