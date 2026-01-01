const Mongoose = require('mongoose');

/**Describe la configuración de un sistema PureVoice de servidor.*/
const ImgurUserSchema = new Mongoose.Schema({
    userId: { type: String },
    /**ID de cliente de Imgur*/
    clientId: { type: String, required: true },
});

const model = Mongoose.model('ImgurUser', ImgurUserSchema);

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} ImgurUserDocument*/

module.exports = model;
