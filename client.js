const { Client, IntentsBitField, Partials } = require("discord.js");
const { Flags: intentBits } = IntentsBitField;

const botIntents = new IntentsBitField().add(
    intentBits.Guilds,
    intentBits.GuildMembers,
    intentBits.GuildExpressions,
    intentBits.GuildIntegrations,
    intentBits.GuildMessages,
    intentBits.GuildMessageReactions,
    intentBits.GuildVoiceStates,
    intentBits.MessageContent,
);

const botPartials = [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
];

const client = new Client({
    intents: botIntents,
    partials: botPartials,
    allowedMentions: {
        parse: [ 'users', 'roles' ],
        repliedUser: false,
    },
});

module.exports = client;