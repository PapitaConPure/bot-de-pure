import type { ConverterDefinition, ConverterService } from 'types/converters';
import { getBotEmoji } from '@/utils/emojis';

export const acceptedPixivConvertersWithoutNone = ['phixiv'] as const;
export const acceptedPixivConverters = ['', ...acceptedPixivConvertersWithoutNone] as const;
export const pixivRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?:http:\/\/|https:\/\/)(?:www\.)?(?:pixiv.net(?<lang>\/en)?)\/artworks\/(?<id>[0-9]{6,9})(?:\/(?<page>[0-9]{1,4}))? ?(?<ed>(?:>|\|\|){0,2})/g;

export type AcceptedPixivConverterKey = (typeof acceptedPixivConvertersWithoutNone)[number];

const pixivConversionServices = {
	phixiv: { name: 'phixiv', link: 'https://phixiv.net' },
} as const satisfies Record<AcceptedPixivConverterKey, ConverterService>;

export const pixivConverter = {
	name: 'PuréPix',
	regex: pixivRegex,
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
} satisfies ConverterDefinition;
