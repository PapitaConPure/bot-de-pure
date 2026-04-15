import Mongoose, { type InferSchemaType } from 'mongoose';
import { acceptedBoorutatoConverters } from '@/systems/converters/boorutato';
import { acceptedPixivConverters } from '@/systems/converters/purepix';
import Locales from '../i18n/locales';
import { acceptedTwitterConverters } from '../systems/converters/pureet';

const UserConfigVoiceSchema = new Mongoose.Schema(
	{
		ping: {
			type: String,
			enum: ['always', 'onCreate', 'never'],
			default: 'always',
		},
		autoname: {
			type: String,
			trim: true,
		},
		autoemoji: {
			type: String,
			trim: true,
		},
		killDelay: {
			type: Number,
		},
	},
	{ _id: false },
);

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
		default: undefined,
	},

	prc: {
		type: Number,
		default: 0,
	},
	lastCultivate: {
		type: Number,
		default: 0,
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
		of: [
			{
				type: String,
				trim: true,
			},
		],
		default: () => new Map() as Map<string, string[]>,
		required: true,
	},
	voice: {
		type: UserConfigVoiceSchema,
		default: {},
		required: true,
	},
	flags: {
		type: [String],
		default: [] as string[],
		required: true,
	},
	pixivConverter: {
		type: String,
		enum: acceptedPixivConverters,
		default: 'phixiv',
	},
	twitterPrefix: {
		type: String,
		enum: acceptedTwitterConverters,
		default: 'vx',
	},
	booruConverters: {
		type: [{
			type: String,
			enum: acceptedBoorutatoConverters,
		}],
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
	},
});

export type UserConfigSchemaType = InferSchemaType<typeof UserConfigSchema>;

export const UserConfigModel = Mongoose.model('UserConfig', UserConfigSchema);

export type UserConfigDocument = InstanceType<typeof UserConfigModel>;

export default UserConfigModel;
