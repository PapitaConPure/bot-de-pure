const Mongoose = require('mongoose');

const GuildConfigSchema = new Mongoose.Schema({
    guildId: { type: String },
    chaos: { type: Boolean, default: false },
    potatoes: { type: Object, default: {} },
});

module.exports = Mongoose.model('GuildConfig', GuildConfigSchema);