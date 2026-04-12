import Mongoose from 'mongoose';
import { FeedConfigSchema, type FeedDocument } from './feeds';
import { makeStringIdValidator } from './modelUtils';
import { type TuberDocument, TuberSchema } from './tubers';

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

		/**Feeds de imágenes del servidor. */
		feeds: {
			type: Map,
			of: FeedConfigSchema,
			default: () => new Map(),
			required: true,
		},
	},
	{
		methods: {
			setTuberField<TKey extends keyof TuberDocument>(
				tuberId: string,
				field: TKey,
				value: TuberDocument[TKey],
			) {
				const tuber = this.tubers.get(tuberId);
				if (!tuber) return false;

				tuber[field] = value;
				this.tubers.set(tuberId, tuber);
				this.markModified(`tubers.${tuberId}.${field}`);

				return true;
			},
			setFeedField<TKey extends keyof FeedDocument>(
				feedId: string,
				field: TKey,
				value: FeedDocument[TKey],
			) {
				const feed = this.feeds.get(feedId);
				if (!feed) return false;

				feed[field] = value;
				this.feeds.set(feedId, feed);
				this.markModified(`feeds.${feedId}.${field}`);

				return true;
			},
		},
	},
);

/**@description Describe la configuración de un servidor.*/
const GuildConfig = Mongoose.model('GuildConfig', GuildConfigSchema);

function m() {
	return new GuildConfig({});
}
export type GuildConfigDocument = ReturnType<typeof m>;

export default GuildConfig;
