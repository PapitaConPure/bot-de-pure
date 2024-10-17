const Mongoose = require('mongoose');

/**Describe la configuración de un sistema PureVoice de servidor.*/
const PureVoiceSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
	},
	/**Categoría en la que se ubica el sistema PureVoice*/
	categoryId: {
		type: String,
		default: '',
	},
	/**Canal de despliegue de Sesiones del sistema*/
	voiceMakerId: {
		type: String,
		default: '',
	},
	/**Listado de Sesiones del sistema*/
	sessions: {
		type: Array,
		default: [],
	},
});

const PureVoiceModel = Mongoose.model('PureVoice', PureVoiceSchema);

function m() { return new PureVoiceModel({}); }
/**@typedef {ReturnType<(typeof m)>} PureVoiceDocument*/

/** */
const PureVoiceSessionSchema = new Mongoose.Schema({
	/** */
	channelId: {
		type: String,
		required: true,
	},
	/** */
	roleId: {
		type: String,
		required: true,
	},
	/** */
	adminId: {
		type: String,
		required: true,
	},
	frozen: {
		type: Boolean,
		default: false,
	},
	killDelaySeconds: {
		type: Number,
		default: 0,
	},
	/** */
	modIds: {
		type: Array,
		default: [],
	},
	/** */
	members: {
		type: Map,
		default: () => new Map(),
	},
	nameChanged: {
		type: Date,
		default: null,
	},
});

const PureVoiceSessionModel = Mongoose.model('PureVoiceSession', PureVoiceSessionSchema);

function n() { return new PureVoiceSessionModel({}); }
/**@typedef {ReturnType<(typeof n)>} PureVoiceSessionDocument*/

module.exports = {
	PureVoiceModel,
	PureVoiceSessionModel,
};
