const Mongoose = require('mongoose');

const configFlags = {
};

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

module.exports = {
    configFlags,
    UserConfig: Mongoose.model('UserConfig', UserConfigSchema),
};