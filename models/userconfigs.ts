import Mongoose from 'mongoose';
import Locales from '../i18n/locales';
import { acceptedTwitterConverters } from '../systems/agents/pureet';

const UserConfigSchema = new Mongoose.Schema({
	userId: {
		type: String,
		required: true,
	},

	language: {
		type: String,
		enum: Object.values(Locales),
		default: Locales.Spanish,
		required: true,
	},
	tzCode: {
		type: String,
		default: null,
	},

	prc: {
		type: Number,
		default: 0
	},
	lastCultivate: {
		type: Number,
		default: 0
	},
	reactionsReceivedToday: {
		type: Number,
		default: 0,
	},
	highlightedToday: {
		type: Boolean,
		default: false,
	},
	messagesToday: {
		type: Number,
		default: 0,
	},
	lastDateReceived: {
		type: Date,
		default: () => new Date(0),
	},

	feedTagSuscriptions: {
		type: Map,
		of: [ String ],
		default: () => { return new Map(); },
		required: true,
	},
	voice: {
		ping: {
			type: String,
			enum: [ 'always', 'onCreate', 'never' ],
			default: 'always',
		},
		autoname: {
			type: String,
			default: '',
		},
		autoemoji: {
			type: String,
			default: '',
		},
		killDelay: {
			type: Number,
			default: 0,
		},
	},
	flags: {
		type: Array,
		default: [],
		required: true,
	},
	pixivConverter: {
		type: String,
		enum: [ '', 'phixiv' ],
		default: 'phixiv',
	},
	twitterPrefix: {
		type: String,
		enum: acceptedTwitterConverters,
		default: 'vx',
	},
	showLevelUp: {
		type: Boolean,
		default: true,
	},
	collectMessageData: {
		type: Boolean,
		default: true,
	},
	banned: {
		type: Boolean,
		default: false,
	},
});

export const UserConfigs = Mongoose.model('UserConfig', UserConfigSchema);

function m() { return new UserConfigs({}); }
export type UserConfigDocument = ReturnType<(typeof m)>;

export default UserConfigs;
