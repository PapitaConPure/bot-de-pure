import type { ApplicationEmoji, EmojiResolvable } from 'discord.js';
import { ClientNotFoundError, client } from '@/core/client';
import Logger from '@/utils/logs';

const { debug } = Logger('DEBUG', 'Emojis');

export interface StaticBotEmoji {
	fallback: string;
}

export interface BotEmoji extends StaticBotEmoji {
	appEmoji?: ApplicationEmoji;
}

const expectedBotEmojis = {
	//Common UI
	checkmark: { fallback: '✅' },
	xmark: { fallback: '❌' },
	warning: { fallback: '⚠️' },
	ballotCheckmark: { fallback: '☑️' },
	refresh: { fallback: '🔃' },
	redo: { fallback: '🔄' },
	plus: { fallback: '➕' },
	trash: { fallback: '🗑️' },
	eye: { fallback: '👁️' },
	comment: { fallback: '🗨️' },
	reply: { fallback: '↪️' },
	bell: { fallback: '🔔' },
	hash: { fallback: '#️⃣' },
	clock: { fallback: '🕒' },
	ellipsis: { fallback: '⚫' },
	image: { fallback: '🖼️' },
	video: { fallback: '🎞️' },
	handshake: { fallback: '🤝' },
	globe: { fallback: '🌐' },
	magGlassLeft: { fallback: '🔍' },
	magGlassRight: { fallback: '🔎' },

	//Header Icons
	guide: { fallback: '📘' },
	command: { fallback: '⚙️' },
	purefeed: { fallback: '🖼️' },
	purevoice: { fallback: '🔊' },
	confessions: { fallback: '🕊️' },

	//Navigation
	backwardstep: { fallback: '⏮️' },
	previous: { fallback: '◀️' },
	next: { fallback: '▶️' },
	forwardstep: { fallback: '⏭️' },
	back: { fallback: '↩️' },

	//Music UI
	play: { fallback: '▶️' },
	pause: { fallback: '⏸️' },
	stop: { fallback: '⏹️' },
	forward: { fallback: '⏩' },
	volumeHigh: { fallback: '🔊' },
	headphonessimple: { fallback: '🎧' },
	repeat: { fallback: '🔁' },
	shuffle: { fallback: '🔀' },
	unshuffle: { fallback: '↩️' },

	//Boorus
	copyrightTag: { fallback: '🏛️' },
	artistTag: { fallback: '🧑‍🎨' },
	characterTag: { fallback: '🧍' },
	boy: { fallback: '♂️' },
	girl: { fallback: '♀️' },
	futa: { fallback: '🍆' },
	lowRes: { fallback: '🔬' },
	highRes: { fallback: '📈' },
	absurdRes: { fallback: '🧬' },
	incrediblyAbsurdRes: { fallback: '🌌' },
	twitterfullcolor: { fallback: '𝕏' },
	pixivfullcolor: { fallback: '🅿' },
} as const satisfies Record<string, StaticBotEmoji>;
export type BotEmojiName = keyof typeof expectedBotEmojis;

let ready = false;

const botEmojis = new Map<BotEmojiName, BotEmoji>();

export async function setupAppEmojis() {
	if (!client?.application) throw new ClientNotFoundError();

	if (ready) return;

	const appEmojis = await client.application.emojis.fetch();
	const appEmojisByName = new Map(appEmojis.map((e) => [e.name, e]));

	for (const [expectedEmojiName, staticBotEmoji] of Object.entries(expectedBotEmojis)) {
		const matchingAppEmoji = appEmojisByName.get(expectedEmojiName);
		console.log(expectedEmojiName, staticBotEmoji, matchingAppEmoji?.name);

		botEmojis.set(expectedEmojiName as BotEmojiName, {
			...staticBotEmoji,
			appEmoji: matchingAppEmoji,
		});
	}

	debug.table(
		[...botEmojis.entries()].map(([name, e]) => ({
			name,
			id: e.appEmoji?.id,
			fallback: e.fallback,
		})),
	);

	ready = true;
}

function expectBotEmoji(emojiName: BotEmojiName): BotEmoji {
	if (!ready) throw new Error('Emojis were not set up properly. Call setupAppEmojis() first.');

	const botEmoji = botEmojis.get(emojiName);

	if (!botEmoji) throw new Error(`Emoji "${emojiName}" not found!`, { cause: emojiName });

	return botEmoji;
}

export function getBotEmoji(emojiName: BotEmojiName): string {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji?.toString() ?? botEmoji.fallback;
}

export function getBotEmojiResult(
	emojiName: BotEmojiName,
): { app: true; emoji: ApplicationEmoji } | { app: false; emoji: string } {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji != null
		? { app: true, emoji: botEmoji.appEmoji }
		: { app: false, emoji: botEmoji.fallback };
}

export function getBotEmojiResolvable(emojiName: BotEmojiName): EmojiResolvable {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji ?? botEmoji.fallback;
}
