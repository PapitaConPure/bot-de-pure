import Mongoose from 'mongoose';

/** Describe la configuración de Saki Scans (Hourai Doll) */
const SakiSchema = new Mongoose.Schema({
	configs: {
		type: Object,
		bienvenida: { type: Boolean, default: true } as unknown as boolean,
		despedida: { type: Boolean, default: true } as unknown as boolean,
		pingBienvenida: { type: Boolean, default: true } as unknown as boolean,
		default: {},
	},
	customRoles: { type: Object, default: {} },
	mentionRoles: {
		type: Object,
		GAMES: {
			type: Object,
			functionName: 'selectGame',
			rolePool: [],
			exclusive: false,
			required: true,
		},
		DRINKS: {
			functionName: 'selectDrink',
			rolePool: [],
			exclusive: false,
			required: true,
		},
		FAITH: {
			functionName: 'selectReligion',
			rolePool: [],
			exclusive: true,
			required: true,
		},
		default: {
			GAMES: {
				functionName: 'selectGame',
				rolePool: [],
				exclusive: false,
			},
			DRINKS: {
				functionName: 'selectDrink',
				rolePool: [],
				exclusive: false,
			},
			FAITH: {
				functionName: 'selectReligion',
				rolePool: [],
				exclusive: true,
			},
		},
	},
});

const Saki = Mongoose.model('Hourai', SakiSchema);

function m() { return new Saki({}); }
export type SakiDocument = ReturnType<(typeof m)>;

export default Saki;
