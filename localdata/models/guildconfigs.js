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

module.exports = Mongoose.model('GuildConfig', GuildConfigSchema);