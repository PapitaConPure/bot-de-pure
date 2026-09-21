import type { ConverterDefinition, ConverterService } from 'types/converters';
import { getBotEmoji } from '@/utils/emojis';
import { searchParamsToString } from '@/utils/formatting';
import { parseSearchParams } from '@/utils/parsing';

export const instagramConvertRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?:http:\/\/|https:\/\/)(?:www\.)?instagram.com\/(?<page>p|reel|post|slide)\/(?<id>[A-Za-z]{7,12})(?:\/(?<q>\?(?:&?[a-z]{1,9}=[^&\s]{1,20})+)?)? ?(?<ed>(?:>|\|\|){0,2})/g;

export const instagramConversionServices = {
	dd: { name: 'ddinstagram', link: 'https://ddinstagram.com' },
	ddd: { name: 'd.ddinstagram', link: 'https://d.ddinstagram.com' },
	gdd: { name: 'g.ddinstagram', link: 'https://g.ddinstagram.com' },
	kirk: { name: 'kirkstagram', link: 'https://kirkstagram.com' },
	kk: { name: 'instagramkk', link: 'https://instagramkk.com' },
	ez: { name: 'instagramez', link: 'https://instagramez.com' },
	dogin: { name: 'd.oginstagram', link: 'https://d.oginstagram.com' },
} as const satisfies Record<string, ConverterService>;
export type AcceptedInstagramConverterKey = keyof typeof instagramConversionServices;

export const acceptedInstagramConvertersWithoutNone = Object.keys(
	instagramConversionServices,
) as ReadonlyArray<AcceptedInstagramConverterKey>;
export const acceptedInstagramConverters = ['', ...acceptedInstagramConvertersWithoutNone] as const;

export const instagramConverter = {
	name: 'Puréstagram',
	regex: instagramConvertRegex,
	external: {
		services: instagramConversionServices,
		convert(matchedLinks, { serviceLink }) {
			if (!serviceLink) return {};

			const formattedInstagramUrls = matchedLinks.map((u) => {
				const { st = '', page, id, q = null, ed = '' } = u.groups ?? {};
				const spoiler = st.includes('||') && ed.includes('||') ? '||' : '';

				const searchParams = q ? parseSearchParams(q) : new Map<string, string>();
				searchParams.delete('stkn'); //Tracker
				const qProcessed =
					searchParams.size > 0 ? `/${searchParamsToString(searchParams)}` : '';

				return `${spoiler}${getBotEmoji('instagramColor')}[\`${id}\`](${serviceLink}/${page}/${id}${qProcessed})${spoiler}`;
			});

			const content = formattedInstagramUrls.join(' ');

			return { content };
		},
	},
} as const satisfies ConverterDefinition;
