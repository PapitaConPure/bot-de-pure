const Mongoose = require('mongoose');

/**Describe la configuración de un sistema PureVoice de servidor.*/
const SauceNAOUserSchema = new Mongoose.Schema({
    userId: { type: String },
    /**ID de cliente de SauceNAO*/
    clientId: { type: String, required: true },
});

const model = Mongoose.model('SauceNAOUser', SauceNAOUserSchema);

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} SauceNAOUserDocument*/

module.exports = model;
