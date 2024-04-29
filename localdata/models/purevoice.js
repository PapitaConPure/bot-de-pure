const Mongoose = require('mongoose');

/**Describe la configuración de un sistema PureVoice de servidor.*/
const PureVoiceSchema = new Mongoose.Schema({
    guildId: { type: String },
    /**Categoría en la que se ubica el sistema PureVoice*/
    categoryId: { type: String, default: '' },
    /**Canal de despliegue de Sesiones del sistema*/
    voiceMakerId: { type: String, default: '' },
    /**Listado de Sesiones del sistema*/
    sessions: { type: Array, default: [] },
});

const model = Mongoose.model('PureVoice', PureVoiceSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} PureVoiceDocument*/

module.exports = model;
