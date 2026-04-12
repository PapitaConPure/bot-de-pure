import Mongoose from 'mongoose';

const SakiMentionRolePoolSchema = new Mongoose.Schema(
	{
		id: {
			type: String,
			required: true,
		},
		label: {
			type: String,
			required: true,
		},
		emote: {
			type: String,
			required: true,
		},
	},
	{ _id: false },
);

const SakiMentionRoleSchema = new Mongoose.Schema(
	{
		functionName: {
			type: String,
			required: true,
		},
		rolePool: {
			type: [SakiMentionRolePoolSchema],
			required: true,
		},
		exclusive: {
			type: Boolean,
		},
	},
	{ _id: false },
);

/**@description Describe la configuración de Saki Scans*/
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
		type: new Mongoose.Schema(
			{
				GAMES: {
					type: SakiMentionRoleSchema,
					required: true,
				},
				DRINKS: {
					type: SakiMentionRoleSchema,
					required: true,
				},
				FAITH: {
					type: SakiMentionRoleSchema,
					required: true,
				},
			},
			{ _id: false },
		),
		required: true,
	},
});

const Saki = Mongoose.model('Hourai', SakiSchema);

function m() {
	return new Saki({});
}
export type SakiDocument = ReturnType<typeof m>;

export default Saki;
