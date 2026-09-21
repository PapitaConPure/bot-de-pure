import type { ConverterDefinition, ConverterService } from 'types/converters';
import { getBotEmoji } from '@/utils/emojis';

export const pixivConvertRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?:http:\/\/|https:\/\/)(?:www\.)?(?:pixiv.net(?<lang>\/en)?)\/artworks\/(?<id>[0-9]{6,9})(?:\/(?<page>[0-9]{1,4}))? ?(?<ed>(?:>|\|\|){0,2})/g;

export const pixivConversionServices = {
	phixiv: { name: 'phixiv', link: 'https://phixiv.net' },
} as const satisfies Record<string, ConverterService>;
export type AcceptedPixivConverterKey = keyof typeof pixivConversionServices;

export const acceptedPixivConvertersWithoutNone = Object.keys(
	pixivConversionServices,
) as ReadonlyArray<AcceptedPixivConverterKey>;
export const acceptedPixivConverters = ['', ...acceptedPixivConvertersWithoutNone] as const;

export const pixivConverter = {
	name: 'PuréPix',
	regex: pixivConvertRegex,
	external: {
		services: pixivConversionServices,
		convert(matchedLinks, { serviceLink }) {
			if (!serviceLink) return {};

			const formattedPixivUrls = matchedLinks.map((u) => {
				const { st = '', id, lang = '', page = null, ed = '' } = u.groups ?? {};
				const spoiler = st.includes('||') && ed.includes('||') ? '||' : '';
				const idAndPage = page ? `${id}/${page}` : id;
				return `${spoiler}${getBotEmoji('pixivColor')}[\`${idAndPage}\`](${serviceLink}${lang}/artworks/${idAndPage})${spoiler}`;
			});

			const content = formattedPixivUrls.join(' ');

			return { content };
		},
	},
} as const satisfies ConverterDefinition;
