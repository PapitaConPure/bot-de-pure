const Mongoose = require('mongoose');

/** Describe la configuración de un sistema PureVoice de servidor. */
const PureVoiceSchema = new Mongoose.Schema({
    guildId: { type: String },
    /** Categoría en la que se ubica el sistema PureVoice */
    categoryId: { type: String, default: '' },
    /** Categoría en la que se ubica el sistema PureVoice */
    voiceMakerId: { type: String, default: '' },
    /** Categoría en la que se ubica el sistema PureVoice */
    sessions: { type: Array, default: [] },
});

module.exports = Mongoose.model('PureVoice', PureVoiceSchema);