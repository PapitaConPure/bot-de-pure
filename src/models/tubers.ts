import Mongoose, { type InferSchemaType } from 'mongoose';
import { CURRENT_PS_VERSION } from '../systems/ps/common/executeTuber';

const TuberInputSchema = new Mongoose.Schema({
	name: {
		type: String,
		default: 'input',
	},
	desc: {
		type: String,
		default: null,
	},
	kind: {
		type: String,
		enum: ['Number', 'Text', 'Boolean'],
	},
	optional: {
		type: Boolean,
		default: false,
	},
	spread: {
		type: Boolean,
		default: false,
	},
});

export const TuberSchema = new Mongoose.Schema({
	id: {
		type: String,
		required: true,
	},
	guildId: {
		type: String,
	},
	author: {
		type: String,
		required: true,
	},
	desc: {
		type: String,
		default: null,
	},
	inputs: {
		type: [[TuberInputSchema]],
		default: [],
	},
	advanced: {
		type: Boolean,
	},
	content: {
		type: String,
	},
	files: {
		type: Array,
	},
	script: {
		type: Mongoose.SchemaTypes.Mixed,
	},
	psVersion: {
		type: Number,
		default: () => CURRENT_PS_VERSION,
	},
	saved: {
		type: Map,
		of: Mongoose.SchemaTypes.Mixed,
	},
});

export type TuberSchemaType = InferSchemaType<typeof TuberSchema>;

const TuberModel = Mongoose.model('Tuber', TuberSchema);

export type TuberDocument = InstanceType<typeof TuberModel>;

export default TuberModel;
