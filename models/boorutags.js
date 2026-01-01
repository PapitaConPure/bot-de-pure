const Mongoose = require('mongoose');
const Int32 = require('mongoose-int32').loadType(Mongoose);
const TypeSafeInt32 = /**@type {typeof Number}*/(/**@type {unknown}*/(Int32));

const tagSchema = new Mongoose.Schema({
    _id: TypeSafeInt32,
    id: {
        type: TypeSafeInt32,
        required: true,
        min: [ 0, 'La id de la tag debe ser 0 ó mayor' ],
    },
    name: {
        type: String,
        required: true,
        unique: true,
        minLength: [ 1, 'El nombre de la tag no puede estar vacío' ],
    },
    count: {
        type: TypeSafeInt32,
        required: true,
        min: [ 0, 'La cantidad de ocurrencias de la tag debe ser 0 ó mayor' ],
    },
    type: {
        type: TypeSafeInt32,
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

// eslint-disable-next-line no-unused-vars
function m() { return new model({}); }
/**@typedef {ReturnType<(typeof m)>} TagDocument*/

module.exports = model;
