import Mongoose from 'mongoose';
import _Int32 from 'mongoose-int32';
const Int32 = _Int32.loadType(Mongoose);
const TypeSafeInt32 = (Int32 as unknown) as typeof Number;

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

function m() { return new model({}); }
export type TagDocument = ReturnType<(typeof m)>;

export default model;
