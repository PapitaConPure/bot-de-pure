const Mongoose = require('mongoose');

/** Describe la configuración de un servidor. */
const HouraiSchema = new Mongoose.Schema({
    /** Habilitar modo caótico del servidor. */
    userInfractions: { type: Object, default: {} },
});

module.exports = Mongoose.model('Hourai', HouraiSchema);