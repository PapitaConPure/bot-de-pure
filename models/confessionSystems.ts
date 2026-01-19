import Mongoose from 'mongoose';
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
		validator: makeStringIdValidator('Se esperaba una ID de canal de auditoría que no estuviera vacía'),
	},
	confessionsChannelId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de canal de confesiones que no estuviera vacía'),
	},
	pending: {
		type: Array,
		default: [],
	},
});

const ConfessionSystem = Mongoose.model('ConfessionSystem', ConfessionSystemSchema);

function m() { return new ConfessionSystem({}); }
export type ConfessionSystemDocument = ReturnType<(typeof m)>;

export default ConfessionSystem;
