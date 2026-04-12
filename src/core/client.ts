import { Client, IntentsBitField, Partials } from 'discord.js';

const { Flags: intentBits } = IntentsBitField;

export let client: Client<boolean> | undefined = undefined;

export function initializeClient() {
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

	const botPartials = [Partials.Message, Partials.Channel, Partials.Reaction];

	const initializedClient = new Client({
		intents: botIntents,
		partials: botPartials,
		allowedMentions: {
			parse: ['users', 'roles'],
			repliedUser: false,
		},
	});

	client = initializedClient;
	return initializedClient;
}

export class ClientNotFoundError extends Error {
	constructor() {
		super(
			'Discord Client was expected but it was never initialized or registered in the system.',
		);
		this.name = 'ClientNotFoundError';
	}
}
