const Mongoose = require('mongoose');

const tagSchema = new Mongoose.Schema({
    id: {
        type: Number,
        required: true,
        min: [ 0, 'La id de la tag debe ser 0 ó mayor' ],
        unique: true,
    },
    name: {
        type: String,
        required: true,
        minLength: [ 1, 'El nombre de la tag no puede estar vacío' ],
    },
    count: {
        type: Number,
        required: true,
        min: [ 0, 'La cantidad de ocurrencias de la tag debe ser 0 ó mayor' ],
    },
    type: {
        type: Number,
        required: true,
        enum: [ 0, 1, 2, 3, 4, 5, 6 ],
    },
    ambiguous: {
        type: Boolean,
        default: false,
    },
    fetchTimestamp: {
        type: Date,
        default: () => new Date(Date.now()),
    },
});

const model = Mongoose.model('boorutags', tagSchema);

function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} UserConfigDocument*/

module.exports = model;
