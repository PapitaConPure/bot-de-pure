import type { ConverterDefinition, ConverterService } from 'types/converters';
import { getBotEmoji } from '@/utils/emojis';

export const acceptedInstagramConvertersWithoutNone = [
	'dd',
	'ddd',
	'gdd',
	'kirk',
	'kk',
	'ez',
	'dogin',
] as const;
export const acceptedInstagramConverters = ['', ...acceptedInstagramConvertersWithoutNone] as const;
export const instagramRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?:http:\/\/|https:\/\/)(?:www\.)?instagram.com\/(?<page>p|reel|post|slide)\/(?<id>[A-Za-z]{7,12})(?:\/(?<q>\?(?:&?[a-z]{1,9}=[^&\s]{1,20})+)?)? ?(?<ed>(?:>|\|\|){0,2})/g;

export type AcceptedInstagramConverterKey = (typeof acceptedInstagramConvertersWithoutNone)[number];

export const instagramConversionServices = {
	dd: { name: 'ddinstagram', link: 'https://ddinstagram.com' },
	ddd: { name: 'd.ddinstagram', link: 'https://d.ddinstagram.com' },
	gdd: { name: 'g.ddinstagram', link: 'https://g.ddinstagram.com' },
	kirk: { name: 'kirkstagram', link: 'https://kirkstagram.com' },
	kk: { name: 'instagramkk', link: 'https://instagramkk.com' },
	ez: { name: 'instagramez', link: 'https://instagramez.com' },
	dogin: { name: 'd.oginstagram', link: 'https://d.oginstagram.com' },
} as const satisfies Record<AcceptedInstagramConverterKey, ConverterService>;

export const instagramConverter = {
	name: 'Puréstagram',
	regex: instagramRegex,
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
} satisfies ConverterDefinition;

function parseSearchParams(searchParamsStr: string): Map<string, string> {
	if (searchParamsStr.startsWith('?')) searchParamsStr = searchParamsStr.slice(1);
	const searchParamsList = searchParamsStr.split('&');
	const searchParams = new Map<string, string>();

	for (const searchParam of searchParamsList) {
		const eq = searchParam.indexOf('=');
		const key = searchParam.slice(0, eq);
		const value = searchParam.slice(eq + 1);
		searchParams.set(key, value);
	}

	return searchParams;
}

function searchParamsToString(searchParams: Map<string, string>) {
	if (searchParams.size === 0) return '';
	return `?${[...searchParams.entries()].map(([key, value]) => `${key}=${value}`).join('&')}`;
}
