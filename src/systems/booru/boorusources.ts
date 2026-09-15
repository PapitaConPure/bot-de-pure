import { hex2num as c } from '@/utils/color';
import type { BotEmojiName } from '@/utils/emojis';

export interface BooruSourceStyle {
	emoji?: BotEmojiName;
	color: number;
}

export interface MatchableBooruSourceStyle extends BooruSourceStyle {
	pattern: RegExp;
}

export const BooruSourceStyles = {
	pixiv: { color: c('#0096fa'), emoji: 'pixivColor', pattern: /pixiv\.net(?!\/fanbox)/i },
	twitter: {
		color: c('#040404'),
		emoji: 'twitterColor',
		pattern: /[^a-z](twitter|twimg|x)\.com/i,
	},
	fanbox: {
		color: c('#faf18a'),
		emoji: 'fanboxColor',
		pattern: /pixiv\.net\/fanbox|fanbox\.cc/i,
	},
	fantia: { color: c('#ea4c89'), emoji: 'fantiaColor', pattern: /fantia\.jp/i },
	skeb: { color: c('#28837f'), emoji: 'skebColor', pattern: /skeb\.jp/i },
	bluesky: { color: c('#0085ff'), emoji: 'blueskyColor', pattern: /bsky\.app/i },
	dvntart: { color: c('#00e59b'), emoji: 'dvntartColor', pattern: /deviantart\.com/i },
	lofter: { color: c('#009c94'), emoji: 'lofterColor', pattern: /lofter\.com/i },
	bilibili: { color: c('#23aee5'), emoji: 'bilibiliColor', pattern: /bilibili\.com/i },
	cara: { color: c('#020814'), emoji: 'caraColor', pattern: /cara\.app/i },
	tumblr: { color: c('#36465d'), emoji: 'tumblrColor', pattern: /tumblr\.com/i },
	niconico: { color: c('#ff9170'), emoji: 'niconicoColor', pattern: /nicovideo\.jp/i },
	patreon: { color: c('#0b69b7'), emoji: 'patreonColor', pattern: /www\.patreon\.com/i },
	gdrive: { color: c('#fcbd00'), emoji: 'gdriveColor', pattern: /drive\.google\.com/i },
	reddit: { color: c('#ff4500'), emoji: 'redditColor', pattern: /([iv]\.)?redd\.?it(\.com)?/i },
	weibo: { color: c('#ff9a30'), emoji: 'weiboColor', pattern: /weibo\.com/i },
	nitter: { color: c('#ff6c60'), emoji: 'nitterColor', pattern: /nitter\.net/i },
	booth: { color: c('#ff5c67'), emoji: 'boothColor', pattern: /booth\.pm/i },
	youtube: { color: c('#ff0033'), emoji: 'youtubeColor', pattern: /youtube\.com/i },
	newgrnd: { color: c('#fda238'), emoji: 'newgroundsColor', pattern: /www\.newgrounds\.com/i },
	artstation: { color: c('#13aff0'), emoji: 'artstationColor', pattern: /artstation\.com/ },
	instagram: { color: c('#e4405f'), emoji: 'instagramColor', pattern: /instagram\.com/i },
	github: { color: c('#2c424f'), emoji: 'githubColor', pattern: /github\.com/i },
	arcalive: { color: c('#434753'), emoji: 'arcaliveColor', pattern: /arca\.live/i },
	missk: { color: c('#96d04a'), emoji: 'misskeyColor', pattern: /misskey\.(io|dev|social|art)/i },
} as const satisfies Record<string, MatchableBooruSourceStyle>;

export type BooruSourceStyleKey = keyof typeof BooruSourceStyles;

export const BooruSourceStylesList: ReadonlyArray<MatchableBooruSourceStyle> =
	Object.values(BooruSourceStyles);
