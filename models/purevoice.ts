import Mongoose from 'mongoose';

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
	/**Canal de despliegue de Sesiones del sistema*/
	controlPanelId: {
		type: String,
		default: '',
	},
	/**Listado de Sesiones del sistema*/
	sessions: {
		type: Array,
		default: [],
	},
});

export const PureVoiceModel = Mongoose.model('PureVoice', PureVoiceSchema);

function m() { return new PureVoiceModel({}); }
export type PureVoiceDocument = ReturnType<(typeof m)>;

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
	/** */
	modIds: {
		type: Array,
		default: [],
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
	members: {
		type: Map,
		default: () => new Map(),
	},
	nameChanged: {
		type: Date,
		default: null,
	},
});

export const PureVoiceSessionModel = Mongoose.model('PureVoiceSession', PureVoiceSessionSchema);

function n() { return new PureVoiceSessionModel({}); }
export type PureVoiceSessionDocument = ReturnType<(typeof n)>;
