import Mongoose from 'mongoose';
import { makeStringIdValidator } from './modelUtils';

const reminderSchema = new Mongoose.Schema({
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
        minLength: [ 1, 'El contenido del recordatorio no puede estar vacío' ],
    },
    date: {
        type: Date,
        required: true,
    },
});

const Reminder = Mongoose.model('reminder', reminderSchema);

function m() { return new Reminder({}); }
export type ReminderDocument = ReturnType<(typeof m)>;

export default Reminder;
