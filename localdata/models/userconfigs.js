const Mongoose = require('mongoose');

const configFlags = {
    showSlashHelp: 0,
    showLevelUp: 1,
    collectMessageData: 2,
};

const UserConfigSchema = new Mongoose.Schema({
    userId: { type: String },
    customRole: { type: Object, default: {} },
    feedPings: { type: Array, default: [] },
    voice: { type: Object, default: {} },
    flags: { type: Array, default: [] },
});

module.exports = {
    configFlags,
    UserConfig: Mongoose.model('UserConfig', UserConfigSchema),
};