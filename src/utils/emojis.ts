import type { ApplicationEmoji, ComponentEmojiResolvable } from 'discord.js';
import { ClientNotFoundError, client } from '@/core/client';
import Logger from '@/utils/logs';

const { debug, info, warn } = Logger('INFO', 'Emojis');

export interface BotEmoji {
	fallback: string;
	appEmoji?: ApplicationEmoji;
}

/**@description A record containing all the emoji names this bot expect, along with their respective fallbacks in case they don't exist.*/
const expectedBotEmojis = Object.freeze({
	//Common UI (any color)
	xmark: '❌',
	bot: '🤖',

	//Primary/Success/Danger Button Icons (white)
	checkmarkWhite: '✅',
	xmarkWhite: '❌',
	refreshWhite: '🔃',
	redoWhite: '🔄',
	plusWhite: '➕',
	trashWhite: '🗑️',
	eyeWhite: '👁️',
	pencilWhite: '✏️',
	userWhite: '👤',
	clockWhite: '🕒',
	timerWhite: '⏱️',
	globeWhite: '🌐',
	freezeWhite: '❄️',
	handshakeWhite: '🤝',
	magGlassLeftWhite: '🔍',
	magGlassRightWhite: '🔎',

	//Secondary Button Icons (accent color)
	navFirstAccent: '⏮️',
	navPrevAccent: '◀️',
	navNextAccent: '▶️',
	navLastAccent: '⏭️',
	navBackAccent: '↩️',
	xmarkAccent: '❌',
	eyeAccent: '👁️',
	urlAccent: '🔗',
	replyAccent: '↪️',

	//Common UI (accent color)
	userAccent: '👤',
	clockAccent: '🕒',
	bellAccent: '🔔',
	hashAccent: '#️⃣',
	globeAccent: '🌐',
	imageAccent: '🖼️',
	videoAccent: '🎞️',
	expandAccent: '💻',
	ellipsisAccent: '💻',
	handshakeAccent: '🤝',
	heartAccent: '❤️',

	//Language Flags (full color, of course)
	langEs: '🇪🇸',
	langEn: '🇬🇧',
	langJa: '🇯🇵',

	//Command Categories
	cmdMod: '⭐',
	cmdPapa: '🥔',
	cmdOutdated: '🏚️',
	cmdMaintenance: '🛠️',
	cmdMusic: '🎵',
	cmdMeme: '🐸',
	cmdGame: '🎲',
	cmdChaos: '👹',

	//Header Icons (primary-colored box with carved shapes)
	guidePrimary: '📘',
	commandPrimary: '⚙️',

	//Hero Icons (primary gradient-colored box with accent-colored shapes
	boorutatoFullColor: '🖼️',
	purevoiceFullColor: '🔊',
	confessionsFullColor: '🕊️',

	//Hero Icons with site-specific theming
	psFullColor: '🥔',
	twitterFullColor: '𝕏',
	pixivFullColor: '🇵',

	//PRC (currency color)
	prc: '🥔',

	//Music Buttons (white)
	playWhite: '▶️',
	pauseWhite: '⏸️',
	stopWhite: '⏹️',
	skipWhite: '⏩',
	repeatWhite: '🔁',
	shuffleWhite: '🔀',
	unshuffleWhite: '↩️',
	headphonesWhite: '🎧',

	//Voice and Music UI (accent color)
	speakerAccent: '🔊',
	headphonesAccent: '🎧',
	repeatedAccent: '🔁',
	shuffledAccent: '🔀',
	unshuffledAccent: '➡️',

	//Booru General Icons
	gelbooruAccent: '🇬',
	tagAccent: '🏷️',
	tagWhite: '🏷️',
	tagPlus: '➕',
	tagMinus: '➖',
	copyrightTagAccent: '🏛️',
	artistTagAccent: '🧑‍🎨',
	characterTagAccent: '🧍',

	//Source Icons (specific website's primary color)
	//-- Unless it breaks ToS, in which case the website's color & fill guidelines should be followed
	//-- Also, in the case of neutral sites like X, this bot's accent color should be used instead (for legibility).
	gelbooruColor: '🇬',
	twitterColor: '𝕏',
	pixivColor: '🇵',
	redditColor: '🤖',
	tumblrColor: '🇹',
	fanboxColor: '🐙',
	fantiaColor: '🇫',
	skebColor: '📓',
	lofterColor: '🇱',
	bilibiliColor: '🌏',
	blueskyColor: '🦋',
	caraColor: '🇨',
	gdriveColor: '🇬',
	youtubeColor: '▶️',
	boothColor: '🦙',
	weiboColor: '👁‍🗨',
	dvntartColor: '🌐',
	githubColor: '🚀',
	niconicoColor: '📺',
	patreonColor: '🇵',
	newgroundsColor: '⚔️',
	arcaliveColor: '🌏',
	nitterColor: '🐦',
	misskeyColor: '🌐',
	instagramColor: '📸',
	artstationColor: '📸',

	//Booru Tag icons (full color)
	boy: '♂️',
	girl: '♀️',
	futa: '🍆',
	lowRes: '🔬',
	highRes: '📈',
	absurdRes: '🧬',
	incrediblyAbsurdRes: '🌌',

	//Other
	emptySpace: '⚫',
} as const satisfies Record<string, string>);
export type BotEmojiName = keyof typeof expectedBotEmojis;

let ready = false;

/**@description An easily-accessible registry of all the fully available bot application emojis.*/
const botEmojis = new Map<BotEmojiName, BotEmoji>();

/**@description Populates the application emojis registry.*/
export async function setupAppEmojis(): Promise<void> {
	if (!client?.application) throw new ClientNotFoundError();

	if (ready) return;

	const appEmojis = await client.application.emojis.fetch();
	const appEmojisByName = new Map(appEmojis.map((e) => [e.name, e]));

	for (const [expectedEmojiName, emojiFallback] of Object.entries(expectedBotEmojis) as [
		BotEmojiName,
		string,
	][]) {
		const matchingAppEmoji = appEmojisByName.get(expectedEmojiName);

		botEmojis.set(expectedEmojiName, {
			fallback: emojiFallback,
			appEmoji: matchingAppEmoji,
		});

		debug(
			`Processed "${expectedEmojiName}". ${
				matchingAppEmoji?.name
					? `It successfully matched an application emoji of ID: "${matchingAppEmoji.id}".`
					: `Couldn't find a matching application emoji, so "${emojiFallback}" will be used instead as a fallback.`
			}`,
		);
	}

	debug.table(
		[...botEmojis.entries()].map(([name, e]) => ({
			name,
			id: e.appEmoji?.id,
			fallback: e.fallback,
		})),
	);

	const leftOutEmojis = appEmojis.filter((e) => !(e.name in expectedBotEmojis));

	if (leftOutEmojis.size) {
		warn(
			'Some registered application emojis were left out during setup because they were not expected to exist. Enable DEBUG level logging for more information.',
		);
		debug(
			`${leftOutEmojis.size} out of ${appEmojis.size} emojis were ignored because their name is not accounted for within the registry of ${botEmojis.size} expected emojis.`,
		);
		debug(`Ignored emojis are listed below:`);
		debug.table(
			leftOutEmojis.map((e) => ({
				name: e.name,
				id: e.id,
			})),
		);
		debug(
			'If these emojis were supposed to be expected already, please check the casing and ensure the names properly match expected emoji entries.',
		);
		debug(
			'If there is a new emoji, please register it accordingly inside the expectedBotEmojis record.',
		);
	}

	const botEmojisWithOnlyFallback = [...botEmojis.values()].filter((e) => !e.appEmoji);
	if (botEmojisWithOnlyFallback.length) {
		info(
			`Prepared ${botEmojis.size} emoji entries, of which ${botEmojisWithOnlyFallback.length} resorted to fallback versions because some expected names didn't match an application emoji name.`,
		);
		info('For more information, enable DEBUG level logging.');
	} else {
		info(
			`Prepared ${botEmojis.size} emoji entries. All expected names match an application emoji name.`,
		);
	}

	ready = true;
}

/**
 * @description 
 * Tries to obtain the emoji specified by name, and throws if it's not found.
 * @param emojiName The name of the emoji to expect.
 * @returns The expected {@link BotEmoji}'s object.
 */
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

/**
 * @description 
 * Obtains the string representation of the specified bot emoji.
 *
 * This is either the bot emoji's application emoji string representation, or the fallback Unicode string if there's no associated application emoji.
 * @param emojiName The name of the emoji string to obtain.
 * @returns The emoji's string representation.
 */
export function getBotEmoji(emojiName: BotEmojiName): string {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji?.toString() ?? botEmoji.fallback;
}

/**
 * @description 
 * Obtains a result object based on whether the specified bot emoji object had an associated application emoji:
 * * If it does, it returns the bot emoji's application emoji object, with `app` set to `true`.
 * * If it doesn't, it returns the bot emoji's fallback Unicode string, with `app` set to `false`.
 * @param emojiName The name of the emoji ID to obtain.
 * @returns The emoji's string representation.
 */
export function getBotEmojiResult(
	emojiName: BotEmojiName,
): { app: true; emoji: ApplicationEmoji } | { app: false; emoji: string } {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji != null
		? { app: true, emoji: botEmoji.appEmoji }
		: { app: false, emoji: botEmoji.fallback };
}

/**
 * @description 
 * Obtains the identification data of the specified bot emoji.
 *
 * This is either the bot emoji's application emoji ID, or the fallback Unicode string if there's no associated application emoji.
 * @param emojiName The name of the emoji ID to obtain.
 * @returns The bot emoji's ID or Unicode.
 */
export function getBotEmojiResolvable(emojiName: BotEmojiName): ComponentEmojiResolvable {
	const botEmoji = expectBotEmoji(emojiName);

	return botEmoji.appEmoji?.id ?? botEmoji.fallback;
}

/**@description RegExp for Unicode emojis.*/
export const unicodeEmojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

/**@description Returns the first Unicode emoji in the string.*/
export function parseUnicodeEmoji(emoji: string): string | null {
	if (typeof emoji !== 'string') return null;
	return emoji.match(unicodeEmojiRegex)?.[0] ?? null; //Expresión RegExp cursed
}
