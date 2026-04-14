import Mongoose, { type InferSchemaType } from 'mongoose';
import { makeStringIdValidator } from './modelUtils';

const ReminderSchema = new Mongoose.Schema({
	_id: String,
	userId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de usuario que no estuviera vacía'),
	},
	channelId: {
		type: String,
		required: true,
		validator: makeStringIdValidator('Se esperaba una ID de canal que no estuviera vacía'),
	},
	content: {
		type: String,
		required: true,
		minLength: [1, 'El contenido del recordatorio no puede estar vacío'],
	},
	date: {
		type: Date,
		required: true,
	},
});

export type ReminderSchemaType = InferSchemaType<typeof ReminderSchema>;

const ReminderModel = Mongoose.model('reminder', ReminderSchema);

export type ReminderDocument = InstanceType<typeof ReminderModel>;

export default ReminderModel;
