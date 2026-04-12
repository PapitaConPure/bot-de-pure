import Mongoose from 'mongoose';
import { CURRENT_PS_VERSION } from '../systems/ps/common/executeTuber';

const TuberInputSchema = new Mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	desc: {
		type: String,
		default: null,
	},
	kind: {
		type: String,
		enum: ['Number', 'Text', 'Boolean'],
		required: true,
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

const TuberValueSchema = new Mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		desc: {
			type: String,
			default: null,
		},
		kind: {
			type: String,
			required: true,
		},
		optional: {
			type: Boolean,
			required: true,
		},
		spread: {
			type: Boolean,
			required: true,
		},
	},
	{ _id: false },
);

export const TuberSchema = new Mongoose.Schema({
	id: {
		type: String,
		required: true,
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
		type: [String],
	},
	script: {
		type: String,
		default: null,
	},
	psVersion: {
		type: Number,
		default: () => CURRENT_PS_VERSION,
	},
	saved: {
		type: Map,
		of: TuberValueSchema,
	},
});

const Tuber = Mongoose.model('Tuber', TuberSchema);

function m() {
	return new Tuber({});
}
export type TuberDocument = ReturnType<typeof m>;

export default Tuber;
