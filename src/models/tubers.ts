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
		enum: [ 'Number', 'Text', 'Boolean' ],
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

const TuberSchema = new Mongoose.Schema({
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
		type: [ [ TuberInputSchema ] ],
		default: [],
	},
	advanced: {
		type: Boolean,
		required: true,
	},
	content: {
		type: String,
		required: false,
	},
	files: {
		type: [ String ],
	},
	script: {
		type: String,
		default: null,
		required: false,
	},
	psVersion: {
		type: Number,
		default: () => CURRENT_PS_VERSION,
	},
	saved: {
		type: Map,
		of: {
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
		required: false,
	},
});

const Tuber = Mongoose.model('Tuber', TuberSchema);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function m() { return new Tuber({}); }
export type TuberDocument = ReturnType<(typeof m)>;

export default Tuber;
