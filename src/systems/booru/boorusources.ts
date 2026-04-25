import { hex2num as c } from '@/utils/color';
import type { BotEmojiName } from '@/utils/emojis';

export interface BooruSourceStyle {
	emoji?: BotEmojiName;
	color: number;
}

export interface MatchableBooruSourceStyle extends BooruSourceStyle {
	pattern: RegExp;
}

export const BooruSourceStyles: ReadonlyArray<MatchableBooruSourceStyle> = [
	{ color: c('#0096fa'), emoji: 'pixivColor', pattern: /pixiv\.net(?!\/fanbox)/i },
	{ color: c('#040404'), emoji: 'twitterColor', pattern: /[^a-z](twitter|twimg|x)\.com/i },
	{ color: c('#faf18a'), emoji: 'fanboxColor', pattern: /pixiv\.net\/fanbox|fanbox\.cc/i },
	{ color: c('#ea4c89'), emoji: 'fantiaColor', pattern: /fantia\.jp/i },
	{ color: c('#28837f'), emoji: 'skebColor', pattern: /skeb\.jp/i },
	{ color: c('#0085ff'), emoji: 'blueskyColor', pattern: /bsky\.app/i },
	{ color: c('#00e59b'), emoji: 'dvntartColor', pattern: /deviantart\.com/i },
	{ color: c('#009c94'), emoji: 'lofterColor', pattern: /lofter\.com/i },
	{ color: c('#23aee5'), emoji: 'bilibiliColor', pattern: /bilibili\.com/i },
	{ color: c('#020814'), emoji: 'caraColor', pattern: /cara\.app/i },
	{ color: c('#36465d'), emoji: 'tumblrColor', pattern: /tumblr\.com/i },
	{ color: c('#ff9170'), emoji: 'niconicoColor', pattern: /nicovideo\.jp/i },
	{ color: c('#0b69b7'), emoji: 'patreonColor', pattern: /www\.patreon\.com/i },
	{ color: c('#fcbd00'), emoji: 'gdriveColor', pattern: /drive\.google\.com/i },
	{ color: c('#ff4500'), emoji: 'redditColor', pattern: /([iv]\.)?redd\.?it(\.com)?/i },
	{ color: c('#ff9a30'), emoji: 'weiboColor', pattern: /weibo\.com/i },
	{ color: c('#ff6c60'), emoji: 'nitterColor', pattern: /nitter\.net/i },
	{ color: c('#ff5c67'), emoji: 'boothColor', pattern: /booth\.pm/i },
	{ color: c('#ff0033'), emoji: 'youtubeColor', pattern: /youtube\.com/i },
	{ color: c('#fda238'), emoji: 'newgroundsColor', pattern: /www\.newgrounds\.com/i },
	{ color: c('#13aff0'), emoji: 'artstationColor', pattern: /artstation\.com/ },
	{ color: c('#e4405f'), emoji: 'instagramColor', pattern: /instagram\.com/i },
	{ color: c('#2c424f'), emoji: 'githubColor', pattern: /github\.com/i },
	{ color: c('#434753'), emoji: 'arcaliveColor', pattern: /arca\.live/i },
	{ color: c('#96d04a'), emoji: 'misskeyColor', pattern: /misskey\.(io|dev|social|art)/i },
];
