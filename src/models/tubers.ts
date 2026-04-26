import Mongoose, { type InferSchemaType } from 'mongoose';
import { CURRENT_PS_VERSION } from '../systems/ps/common/executeTuber';

const TuberInputSchema = new Mongoose.Schema(
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
	},
	{ _id: false },
);

export const TuberSchema = new Mongoose.Schema({
	tuberId: {
		type: String,
		required: true,
	},
	guildId: {
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
	advanced: {
		type: Boolean,
		required: true,
	},
	content: {
		type: String,
	},
	files: {
		type: Array,
		of: String,
	},
	psVersion: {
		type: Number,
		default: function () {
			return this.advanced ? CURRENT_PS_VERSION : undefined;
		},
		required: function () {
			return !!this.advanced;
		},
	},
	script: {
		type: String,
		required: function () {
			return !!this.advanced;
		},
	},
	inputs: {
		//Tuber input variants → Tuber inputs
		type: [[TuberInputSchema]],
		default: function () {
			return this.advanced ? [] : undefined;
		},
		required: function () {
			return !!this.advanced;
		},
	},
	saved: {
		type: Map,
		of: Mongoose.SchemaTypes.Mixed,
		required: function () {
			return !!this.advanced;
		},
	},
});

TuberSchema.index({ tuberId: 1, guildId: 1 }, { unique: true });

TuberSchema.pre('validate', async function () {
	if (this.advanced) {
		if (this.content != null || this.files != null)
			return new Error('Advanced tubers cannot have content/files');
	} else {
		if (
			this.psVersion != null
			|| this.script != null
			|| this.inputs != null
			|| this.saved != null
		)
			return new Error('Basic tubers cannot have advanced tuber fields');
	}
});

export type TuberInputSchemaType = InferSchemaType<typeof TuberInputSchema>;
export type TuberInputVariantSchemaType = TuberInputSchemaType[];
export type TuberInputVariantsSchemaType = TuberInputVariantSchemaType[];

export type TuberSchemaType = Omit<InferSchemaType<typeof TuberSchema>, 'inputs'> & {
	inputs?: TuberInputVariantsSchemaType;
};

const TuberModel = Mongoose.model('Tuber', TuberSchema);

export type TuberInputDocument = InstanceType<typeof TuberModel>['inputs'][number][number];
export type TuberInputVariantDocument = InstanceType<typeof TuberModel>['inputs'][number];
export type TuberInputVariantsDocument = InstanceType<typeof TuberModel>['inputs'];
export type TuberDocument = InstanceType<typeof TuberModel>;

export default TuberModel;
