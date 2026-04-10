import Mongoose from 'mongoose';
import { makeStringIdValidator } from './modelUtils';
import type { Tubercle } from '../systems/ps/common/executeTuber';
import type { FeedData } from '../systems/booru/boorufeed';

//Perdoname por todos mis pecados
export type TubersDict = Record<string, Tubercle>;
export type FeedsDict = Record<string, FeedData>;

/**@type Describe la configuración de un servidor.*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
const GuildConfigSchema: Mongoose.Schema<unknown, Mongoose.Model<any, any, any, any, any>, {}, {}, {}, {}, Mongoose.DefaultSchemaOptions, { guildId: string; chaos?: boolean; tubers: object; feeds: FeedsDict; }> = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de servidor que no estuviera vacía'),
	},

	/** Habilitar modo caótico del servidor. */
	chaos: { type: Boolean, default: false },

	/** Tubérculos del servidor. */
	tubers: {
		type: {},
		default: {},
		required: true,
	},

	/**Feeds de imágenes del servidor. */
	feeds: {
		type: {} as TubersDict,
		default: {},
		required: true,
	},
});

const GuildConfig = Mongoose.model('GuildConfig', GuildConfigSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new GuildConfig({}); }
export type GuildConfigDocument = ReturnType<(typeof m)>;

export default GuildConfig;
