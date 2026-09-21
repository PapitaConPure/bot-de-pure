import type { ConverterDefinition, ConverterService } from 'types/converters';
import { getBotEmoji } from '@/utils/emojis';

export const twitterConvertRegex =
	/(?:<|\|{2})? ?((?:https?:\/\/)(?:www.)?(?:twitter|x).com\/(\w+)\/status\/(\d+)(?:\/([A-Za-z]+))?) ?(?:>|\|{2})?/g;

export const twitterConversionServices = {
	vx: { name: 'vxTwitter / fixvx', link: 'https://fixvx.com' },
	fx: { name: 'FxTwitter / FixupX', link: 'https://fxtwitter.com' },
	girlcockx: { name: 'girlcockx', link: 'https://girlcockx.com' },
	cunnyx: { name: 'cunnyx', link: 'https://cunnyx.com' },
} as const satisfies Record<string, ConverterService>;
export type AcceptedTwitterConverterKey = keyof typeof twitterConversionServices;

export const acceptedTwitterConvertersWithoutNone = Object.keys(
	twitterConversionServices,
) as ReadonlyArray<AcceptedTwitterConverterKey>;
export const acceptedTwitterConverters = ['', ...acceptedTwitterConvertersWithoutNone] as const;

export const twitterConverter = {
	name: 'Puréet',
	regex: twitterConvertRegex,
	external: {
		services: twitterConversionServices,
		convert(matchedLinks, { serviceLink }) {
			if (!serviceLink) return {};

			const formattedTweetUrls = matchedLinks.map((u) => {
				const [match, /*url*/ , artist, id, ls] = u;
				const spoiler = match.startsWith('||') && match.endsWith('||') ? '||' : '';
				let langSuffix = '';
				if (ls && ls.length <= 2) {
					langSuffix = `/${ls}`;
				}
				return `${spoiler}${getBotEmoji('twitterColor')}[\`${artist}/${id}\`](${serviceLink}/${artist}/status/${id}${langSuffix})${spoiler}`;
			});

			const content = formattedTweetUrls.join(' ');

			return { content };
		},
	},
} as const satisfies ConverterDefinition;
