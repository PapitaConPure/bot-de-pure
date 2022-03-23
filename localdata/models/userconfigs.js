const Mongoose = require('mongoose');

const UserConfigSchema = new Mongoose.Schema({
    userId: { type: String },
    customRole: { type: Object, default: {} },
    feedPings: { type: Array, default: [] },
    voice: { type: Object, default: {} },
    flags: { type: Array, default: [] },
    showSlashHelp: { type: Boolean, default: false },
    showLevelUp: { type: Boolean, default: false },
    collectMessageData: { type: Boolean, default: false },
});

module.exports = Mongoose.model('UserConfig', UserConfigSchema);