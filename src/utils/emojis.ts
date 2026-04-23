import type { ApplicationEmoji, ComponentEmojiResolvable } from 'discord.js';
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
	//Common UI (any color)
	checkmark: { fallback: '✅' },
	xmark: { fallback: '❌' },
	warning: { fallback: '⚠️' },
	ballotCheckmark: { fallback: '☑️' },

	//Primary/Success/Danger Button Icons (white)
	checkmarkWhite: { fallback: '✅' },
	xmarkWhite: { fallback: '❌' },
	refreshWhite: { fallback: '🔃' },
	redoWhite: { fallback: '🔄' },
	plusWhite: { fallback: '➕' },
	trashWhite: { fallback: '🗑️' },
	eyeWhite: { fallback: '👁️' },
	pencilWhite: { fallback: '✏️' },
	userWhite: { fallback: '👤' },
	clockWhite: { fallback: '🕒' },
	timerWhite: { fallback: '⏱️' },
	globeWhite: { fallback: '🌐' },
	freezeWhite: { fallback: '❄️' },
	handshakeWhite: { fallback: '🤝' },
	magGlassLeftWhite: { fallback: '🔍' },
	magGlassRightWhite: { fallback: '🔎' },

	//Secondary Button Icons (accent color)
	navFirstAccent: { fallback: '⏮️' },
	navPrevAccent: { fallback: '◀️' },
	navNextAccent: { fallback: '▶️' },
	navLastAccent: { fallback: '⏭️' },
	navBackAccent: { fallback: '↩️' },
	xmarkAccent: { fallback: '❌' },
	eyeAccent: { fallback: '👁️' },
	urlAccent: { fallback: '🔗' },
	replyAccent: { fallback: '↪️' },

	//Common UI (accent color)
	userAccent: { fallback: '👤' },
	commentAccent: { fallback: '🗨️' },
	clockAccent: { fallback: '🕒' },
	bellAccent: { fallback: '🔔' },
	hashAccent: { fallback: '#️⃣' },
	globeAccent: { fallback: '🌐' },
	imageAccent: { fallback: '🖼️' },
	videoAccent: { fallback: '🎞️' },
	expandAccent: { fallback: '💻' },
	ellipsisAccent: { fallback: '💻' },
	handshakeAccent: { fallback: '🤝' },

	//Language Flags (full color, of course)
	langEs: { fallback: '🇪🇸' },
	langEn: { fallback: '🇬🇧' },
	langJa: { fallback: '🇯🇵' },

	//PRC (currency color)
	prc: { fallback: '🥔' },

	//Header Icons (primary-colored box with carved shapes)
	guidePrimary: { fallback: '📘' },
	commandPrimary: { fallback: '⚙️' },

	//Hero Icons (primary gradient-colored box with accent-colored shapes
	boorutatoFullColor: { fallback: '🖼️' },
	purevoiceFullColor: { fallback: '🔊' },
	confessionsFullColor: { fallback: '🕊️' },

	//Hero Icons with site-specific theming
	psFullColor: { fallback: '🥔' },
	twitterFullColor: { fallback: '𝕏' },
	pixivFullColor: { fallback: '🇵' },

	//Music Buttons (white)
	playWhite: { fallback: '▶️' },
	pauseWhite: { fallback: '⏸️' },
	stopWhite: { fallback: '⏹️' },
	skipWhite: { fallback: '⏩' },
	repeatWhite: { fallback: '🔁' },
	shuffleWhite: { fallback: '🔀' },
	unshuffleWhite: { fallback: '↩️' },

	//Voice and Music UI (accent color)
	speakerAccent: { fallback: '🔊' },
	headphonesAccent: { fallback: '🎧' },
	repeatedAccent: { fallback: '🔁' },
	shuffledAccent: { fallback: '🔀' },
	unshuffledAccent: { fallback: '➡️' },

	//Booru General Icons
	gelbooruAccent: { fallback: '🇬' },
	tagAccent: { fallback: '🏷️' },
	tagWhite: { fallback: '🏷️' },
	tagPlus: { fallback: '➕' },
	tagMinus: { fallback: '➖' },
	copyrightTagAccent: { fallback: '🏛️' },
	artistTagAccent: { fallback: '🧑‍🎨' },
	characterTagAccent: { fallback: '🧍' },

	//Source Icons (specific website's primary color)
	//-- Unless it breaks ToS, in which case the website's color & fill guidelines should be followed
	//-- Also, in the case of neutral sites like X, this bot's accent color should be used instead (for legibility).
	gelbooruColor: { fallback: '🇬' },
	twitterColor: { fallback: '𝕏' },
	pixivColor: { fallback: '🇵' },
	redditColor: { fallback: '🤖' },
	tumblrColor: { fallback: '🇹' },
	fanboxColor: { fallback: '🐙' },
	fantiaColor: { fallback: '🇫' },
	skebColor: { fallback: '📓' },
	lofterColor: { fallback: '🇱' },
	bilibiliColor: { fallback: '🌏' },
	blueskyColor: { fallback: '🦋' },
	caraColor: { fallback: '🇨' },
	gdriveColor: { fallback: '🇬' },
	youtubeColor: { fallback: '▶️' },
	boothColor: { fallback: '🦙' },
	weiboColor: { fallback: '👁‍🗨' },
	dvntartColor: { fallback: '🌐' },
	githubColor: { fallback: '🚀' },
	niconicoColor: { fallback: '📺' },
	patreonColor: { fallback: '🇵' },
	newgroundsColor: { fallback: '⚔️' },

	//Booru Tag icons ()
	boy: { fallback: '♂️' },
	girl: { fallback: '♀️' },
	futa: { fallback: '🍆' },
	lowRes: { fallback: '🔬' },
	highRes: { fallback: '📈' },
	absurdRes: { fallback: '🧬' },
	incrediblyAbsurdRes: { fallback: '🌌' },
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

		debug(expectedEmojiName, staticBotEmoji, matchingAppEmoji?.name);

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
	if (!ready)
		throw new Error(
			`Emojis were not set up properly before trying to get emoji "${emojiName}". Call setupAppEmojis() first.`,
			{ cause: emojiName },
		);

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

export function getBotEmojiResolvable(emojiName: BotEmojiName): ComponentEmojiResolvable {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji?.id ?? botEmoji.fallback;
}
