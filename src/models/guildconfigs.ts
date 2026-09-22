import Mongoose, { type InferSchemaType } from 'mongoose';
import { Locales } from '@/i18n';
import { defaultLocale } from '@/i18n/locales';
import { makeStringIdValidator } from './modelUtils';

/**@description Describe la configuración de un servidor.*/
const GuildConfigSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de servidor que no estuviera vacía'),
	},

	locale: {
		type: String,
		enum: Object.values(Locales),
		default: defaultLocale,
		required: true,
	},

	/** Habilitar modo caótico del servidor. */
	chaos: { type: Boolean, default: false },
});

export type GuildConfigSchemaType = InferSchemaType<typeof GuildConfigSchema>;

export const GuildConfigModel = Mongoose.model('GuildConfig', GuildConfigSchema);

export type GuildConfigDocument = InstanceType<typeof GuildConfigModel>;

export default GuildConfigModel;
