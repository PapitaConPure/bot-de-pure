const { Client, IntentsBitField, Partials } = require("discord.js");
const { Flags: intentBits } = IntentsBitField;

const botIntents = new IntentsBitField().add(
    intentBits.Guilds,
    intentBits.GuildMembers,
    intentBits.GuildEmojisAndStickers,
    intentBits.GuildIntegrations,
    intentBits.GuildPresences,
    intentBits.GuildMessages,
    intentBits.GuildMessageReactions,
    intentBits.GuildMessageTyping,
    intentBits.GuildVoiceStates,
    intentBits.DirectMessages,
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
    //@ts-expect-error
    fetchAllMembers: true,
    allowedMentions: {
        parse: [ 'users', 'roles' ],
        repliedUser: false,
    },
});

module.exports = client;