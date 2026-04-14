import type { Image } from '@napi-rs/canvas';
import { type InferSchemaType, model, Schema } from 'mongoose';

export const pureTableAssets = {
	defaultEmote: '1267233873864032318',
	image: null as unknown as Image,
};

const PureTableSchema = new Schema({
	cells: {
		type: [[String]],
		default: Array(16)
			.fill(null)
			.map(() => Array(16).fill(pureTableAssets.defaultEmote)),
	},
});

const AnarchyUserSkillSchema = new Schema(
	{
		hline: { type: Number, default: 1 },
		vline: { type: Number, default: 1 },
		x: { type: Number, default: 1 },
		square: { type: Number },
		circle: { type: Number },
		diamond: { type: Number },
		heart: { type: Number },
		tetris: { type: Number },
		p: { type: Number },
		exclamation: { type: Number },
		a: { type: Number },
		ultimate: { type: Number },
	},
	{ _id: false },
);

const AnarchyUserSchema = new Schema({
	userId: { type: String },
	last: { type: Number, default: 0 },
	exp: { type: Number, default: 0 },
	skills: AnarchyUserSkillSchema,
});

export type PureTableSchemaType = InferSchemaType<typeof PureTableSchema>;
export type AnarchyUserSchemaType = InferSchemaType<typeof AnarchyUserSchema>;

export const PureTable = model('PureTable', PureTableSchema);
export const AnarchyUser = model('AnarchyUser', AnarchyUserSchema);

export type PureTableDocument = InstanceType<typeof PureTable>;
export type AnarchyUserDocument = InstanceType<typeof AnarchyUser>;
