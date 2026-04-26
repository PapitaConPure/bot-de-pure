import Mongoose, { type InferSchemaType } from 'mongoose';
import { makeStringIdValidator } from './modelUtils';

const GuildConfigSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de servidor que no estuviera vacía'),
	},

	/** Habilitar modo caótico del servidor. */
	chaos: { type: Boolean, default: false },
});

export type GuildConfigSchemaType = InferSchemaType<typeof GuildConfigSchema>;

/**@description Describe la configuración de un servidor.*/
const GuildConfig = Mongoose.model('GuildConfig', GuildConfigSchema);

export type GuildConfigDocument = InstanceType<typeof GuildConfig>;

export default GuildConfig;
