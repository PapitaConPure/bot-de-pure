const Mongoose = require('mongoose');

const HouraiSchema = new Mongoose.Schema({
    userInfractions: { type: Object, default: {} },
    customRoles: { type: Object, default: {} },
});

module.exports = Mongoose.model('Hourai', HouraiSchema);