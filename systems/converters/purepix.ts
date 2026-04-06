import { ChannelType, Message } from 'discord.js';
import { ConverterEmptyPayload, ConverterPayload } from './converters';

import Logger from '../../utils/logs';
const { error } = Logger('WARN', 'PuréPix');

export const acceptedPixivConvertersWithoutNone = [ 'phixiv' ] as const;
export const acceptedPixivConverters = [ '', ...acceptedPixivConvertersWithoutNone ] as const;
export const pixivRegex = /(?<st>(?:<|\|\|){0,2}) ?(?:(?:http:\/\/|https:\/\/)(?:www\.))?(?:pixiv.net(?<lang>\/en)?)\/artworks\/(?<id>[0-9]{6,9})(?:\/(?<page>[0-9]{1,4}))? ?(?<ed>(?:>|\|\|){0,2})/g;

export type AcceptedPixivConverterKey = (typeof acceptedPixivConvertersWithoutNone)[number];
/**@satisfies {Record<AcceptedPixivConverterKey, { name: string, service: string }>}*/
const pixivConversionServices = ({
	phixiv: { name: 'phixiv', service: 'https://www.phixiv.net' },
}) as const;

/**
 * @description Detecta enlaces de pixiv en un mensaje y los reenvía con un Embed corregido, a través de una respuesta.
 * @param message El mensaje a analizar
 * @param converterKey El identificador de servicio de conversión a utilizar
 */
export async function sendConvertedPixivPosts(message: Message<true>, converterKey: AcceptedPixivConverterKey | ''): Promise<ConverterPayload> {
	if(converterKey === '')
		return ConverterEmptyPayload;

	const { content: messageContent, channel } = message;

	if(!message.guild.members.me.permissionsIn(channel).has([ 'SendMessages', 'ManageMessages', 'AttachFiles' ]))
		return ConverterEmptyPayload;

	if(channel.type === ChannelType.PublicThread) {
		try {
			const { parent } = channel;
			if(parent.type === ChannelType.GuildForum && (await channel.fetchStarterMessage()).id === message.id)
				return ConverterEmptyPayload;
		} catch(err) {
			error(err);
			return ConverterEmptyPayload;
		}
	}

	const pixivUrls = [ ...messageContent.matchAll(pixivRegex) ]
		.filter(u => !(u.groups.st?.includes('<') && u.groups.ed?.includes('>')))
		.slice(0, 16);

	if(!pixivUrls.length)
		return ConverterEmptyPayload;

	const configProp = pixivConversionServices[converterKey];
	if(configProp == undefined)
		return ConverterEmptyPayload;

	const service = configProp.service;
	const formattedPixivUrls = pixivUrls
		.map(u => {
			const { st = '', id, lang = '', page = null, ed = '' } = u.groups;
			const spoiler = st.includes('||') && ed.includes('||')
				? '||'
				: '';
			const idAndPage = page ? `${id}/${page}`: id;
			return `${spoiler}<:pixiv2:1334816111270563880>[\`${idAndPage}\`](${service}${lang}/artworks/${idAndPage})${spoiler}`;
		});

	const content = formattedPixivUrls.join(' ');

	return { contentful: true, content };
}
