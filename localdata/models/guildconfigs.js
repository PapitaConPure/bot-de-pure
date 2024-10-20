const Mongoose = require('mongoose');
const { makeStringIdValidator } = require('./modelUtils');

/**
 * Perdoname por todos mis pecados
 * @typedef {{ [x: String]: import('../../systems/booru/boorufeed').FeedData }} FeedsDict 
 */

/**@type {Mongoose.Schema<any, Mongoose.Model<any, any, any, any, any>, {}, {}, {}, {}, Mongoose.DefaultSchemaOptions, { guildId: String, chaos?: Boolean, tubers: Object, feeds: FeedsDict }>} Describe la configuración de un servidor.*/
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

	/**Feeds de imágenes del servidor. */
	feeds: {
		type: /**@type {{ [x: String]: import('../../systems/booru/boorufeed').FeedData }}*/(/**@type {unknown}*/(Object)),
		default: {},
		required: true,
	},
});

const model = Mongoose.model('GuildConfig', GuildConfigSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} GuildConfigDocument*/

module.exports = model;
