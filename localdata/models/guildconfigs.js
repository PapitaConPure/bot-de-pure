const Mongoose = require('mongoose');
const { makeStringIdValidator } = require('./modelUtils');

/** Describe la configuración de un servidor. */
const GuildConfigSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
        validator: makeStringIdValidator('Se esperaba una ID de servidor que no estuviera vacía'),
	},

	/** Habilitar modo caótico del servidor. */
	chaos: { type: Boolean, default: false },
	
	/** Tubérculos del servidor. */
	tubers: {
		type: Object,
		default: {},
		required: true,
	},

	/**@type {import('../../systems/booru/boorufetch').FeedData} Feeds de imágenes del servidor. */
	feeds: {
		//@ts-expect-error
		type: Object,
		default: {},
		required: true,
	},
});

const model = Mongoose.model('GuildConfig', GuildConfigSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} GuildConfigDocument*/

module.exports = model;
