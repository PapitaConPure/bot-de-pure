const Mongoose = require('mongoose');

/** Describe la configuración de un servidor. */
const GuildConfigSchema = new Mongoose.Schema({
    guildId: { type: String },
    /** Habilitar modo caótico del servidor. */
    chaos: { type: Boolean, default: false },
    /** Papas del servidor. */
    tubers: { type: Object, default: {} },
    /** Feeds de imágenes del servidor. */
    feeds: { type: Object, default: {} },
});

const model = Mongoose.model('GuildConfig', GuildConfigSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} GuildConfigDocument*/

module.exports = model;
