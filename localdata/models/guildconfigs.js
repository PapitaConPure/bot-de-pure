const Mongoose = require('mongoose');

/** Describe la configuración de un servidor. */
const GuildConfigSchema = new Mongoose.Schema({
    guildId: { type: String },
    /** Habilitar modo caótico del servidor. */
    chaos: { type: Boolean, default: false },
    /** Habilitar mejora de vista previa de pixiv del servidor. */
    pixify: { type: Boolean, default: false },
    /** Papas del servidor. */
    potatoes: { type: Object, default: {} },
});

module.exports = Mongoose.model('GuildConfig', GuildConfigSchema);