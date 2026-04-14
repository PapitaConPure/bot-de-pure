import Mongoose, { type InferSchemaType } from 'mongoose';
import { makeStringIdValidator } from './modelUtils';

const ConfessionSystemSchema = new Mongoose.Schema({
	guildId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de servidor que no estuviera vacía'),
	},
	logChannelId: {
		type: String,
		required: true,
		validator: makeStringIdValidator(
			'Se esperaba una ID de canal de auditoría que no estuviera vacía',
		),
	},
	confessionsChannelId: {
		type: String,
		required: true,
		validator: makeStringIdValidator(
			'Se esperaba una ID de canal de confesiones que no estuviera vacía',
		),
	},
	pending: {
		type: [String],
		default: [],
	},
});

export type ConfessionSystemSchemaType = InferSchemaType<typeof ConfessionSystemSchema>;

const ConfessionSystemModel = Mongoose.model('ConfessionSystem', ConfessionSystemSchema);

export type ConfessionSystemDocument = InstanceType<typeof ConfessionSystemModel>;

export default ConfessionSystemModel;
