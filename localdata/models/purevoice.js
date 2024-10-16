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

const PureVoiceSessionMemberRoles = /**@type {const}*/({
	GUEST: 0,
	MOD: 1,
	ADMIN: 2,
});
/**@typedef {import('types').ValuesOf<typeof PureVoiceSessionMemberRoles>} PureVoiceSessionMemberRole*/

/**
 * @typedef {Object} PureVoiceSessionMemberJSONBody
 * @property {String} id
 * @property {Boolean} whitelisted
 * @property {Boolean} banned
 * @property {PureVoiceSessionMemberRole} role
 */

class PureVoiceSessionMember {
	id;
	role;
	#whitelisted;
	#banned;

	/**@param {Partial<PureVoiceSessionMemberJSONBody>} data*/
	constructor(data) {
		this.id = data?.id ?? null;
		this.role = data?.role ?? PureVoiceSessionMemberRoles.GUEST;
		this.#whitelisted = !!(data?.whitelisted ?? false);
		this.#banned = !!(data?.banned ?? false);
	}

	/**@param {Boolean} whitelist*/
	setWhitelisted(whitelist) {
		this.#whitelisted = !!whitelist;
	}
	
	/**@param {Boolean} ban*/
	setBanned(ban) {
		this.#banned = !!ban;
	}

	isWhitelisted() {
		return this.role === PureVoiceSessionMemberRoles.ADMIN
			|| this.role === PureVoiceSessionMemberRoles.MOD
			|| this.#whitelisted;
	}

	isBanned() {
		return this.role === PureVoiceSessionMemberRoles.ADMIN
			|| this.role === PureVoiceSessionMemberRoles.MOD
			|| this.#whitelisted;
	}

	/**@returns {PureVoiceSessionMemberJSONBody} */
	toJSON() {
		return {
			id: this.id,
			role: this.role,
			banned: this.#banned,
			whitelisted: this.#whitelisted,
		};
	}
}

const PureVoiceSessionModel = Mongoose.model('PureVoiceSession', PureVoiceSessionSchema);

function n() { return new PureVoiceSessionModel({}); }
/**@typedef {ReturnType<(typeof n)>} PureVoiceSessionDocument*/

module.exports = {
	PureVoiceModel,
	PureVoiceSessionModel,
	PureVoiceSessionMember,
	PureVoiceSessionMemberRoles,
};
