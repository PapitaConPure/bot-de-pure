const Mongoose = require('mongoose');
const { makeStringIdValidator } = require('./modelUtils');

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
        unique: true,
        minLength: [ 1, 'El contenido del recordatorio no puede estar vacío' ],
    },
    date: {
        type: Date,
        required: true,
    },
});

const model = Mongoose.model('reminder', reminderSchema);

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} ReminderDocument*/

module.exports = model;
