import { hex2num } from '@/utils/color';
import type { BotEmojiName } from '@/utils/emojis';

export interface BooruSourceStyle {
	emoji?: BotEmojiName;
	color: number;
}

export interface MatchableBooruSourceStyle extends BooruSourceStyle {
	pattern: RegExp;
}

export const BooruSourceStyles: ReadonlyArray<MatchableBooruSourceStyle> = [
	{ color: hex2num('#0096fa'), emoji: 'pixivColor', pattern: /pixiv\.net(?!\/fanbox)/i },
	{ color: hex2num('#040404'), emoji: 'twitterColor', pattern: /[^a-z](twitter|twimg|x)\.com/i },
	{ color: hex2num('#faf18a'), emoji: 'fanboxColor', pattern: /pixiv\.net\/fanbox|fanbox\.cc/i },
	{ color: hex2num('#ea4c89'), emoji: 'fantiaColor', pattern: /fantia\.jp/i },
	{ color: hex2num('#28837f'), emoji: 'skebColor', pattern: /skeb\.jp/i },
	{ color: hex2num('#0085ff'), emoji: 'blueskyColor', pattern: /bsky\.app/i },
	{ color: hex2num('#00e59b'), emoji: 'dvntartColor', pattern: /deviantart\.com/i },
	{ color: hex2num('#009c94'), emoji: 'lofterColor', pattern: /lofter\.com/i },
	{ color: hex2num('#23aee5'), emoji: 'bilibiliColor', pattern: /bilibili\.com/i },
	{ color: hex2num('#020814'), emoji: 'caraColor', pattern: /cara\.app/i },
	{ color: hex2num('#36465d'), emoji: 'tumblrColor', pattern: /tumblr\.com/i },
	{ color: hex2num('#ff9170'), emoji: 'niconicoColor', pattern: /nicovideo\.jp/i },
	{ color: hex2num('#0b69b7'), emoji: 'patreonColor', pattern: /www\.patreon\.com/i },
	{ color: hex2num('#fcbd00'), emoji: 'gdriveColor', pattern: /drive\.google\.com/i },
	{ color: hex2num('#ff4500'), emoji: 'redditColor', pattern: /([iv]\.)?redd\.?it(\.com)?/i },
	{ color: hex2num('#ff9a30'), emoji: 'weiboColor', pattern: /weibo\.com/i },
	{ color: hex2num('#ff6c60'), emoji: 'nitterColor', pattern: /nitter\.net/i },
	{ color: hex2num('#ff5c67'), emoji: 'boothColor', pattern: /booth\.pm/i },
	{ color: hex2num('#ff0033'), emoji: 'youtubeColor', pattern: /youtube\.com/i },
	{ color: hex2num('#fda238'), emoji: 'newgroundsColor', pattern: /www\.newgrounds\.com/i },
	{ color: hex2num('#2c424f'), emoji: 'githubColor', pattern: /github\.com/i },
	{ color: hex2num('#434753'), emoji: 'arcaliveColor', pattern: /arca\.live/i },
];
