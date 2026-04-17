import Mongoose, { type InferSchemaType } from 'mongoose';
import { makeStringIdValidator } from './modelUtils';
import { TuberSchema, type TuberSchemaType } from './tubers';

const GuildConfigSchema = new Mongoose.Schema(
	{
		guildId: {
			type: String,
			required: true,
			validator: makeStringIdValidator(
				'Se esperaba una ID de servidor que no estuviera vacía',
			),
		},

		/** Habilitar modo caótico del servidor. */
		chaos: { type: Boolean, default: false },

		/** Tubérculos del servidor. */
		tubers: {
			type: Map,
			of: TuberSchema,
			default: () => new Map(),
			required: true,
		},
	},
	{
		methods: {
			setTuberField<TKey extends keyof TuberSchemaType>(
				tuberId: string,
				field: TKey,
				value: TuberSchemaType[TKey],
			) {
				const tuber = this.tubers.get(tuberId);
				if (!tuber) return false;

				tuber[field] = value;
				this.tubers.set(tuberId, tuber);
				this.markModified(`tubers.${tuberId}.${field}`);

				return true;
			},
		},
	},
);

export type GuildConfigSchemaType = InferSchemaType<typeof GuildConfigSchema>;

/**@description Describe la configuración de un servidor.*/
const GuildConfig = Mongoose.model('GuildConfig', GuildConfigSchema);

export type GuildConfigDocument = InstanceType<typeof GuildConfig>;

export default GuildConfig;
