import type { ContainerBuilder, Message } from 'discord.js';
import { ChannelType, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { isNSFWChannel } from '@/func';
import Logger from '@/utils/logs';
import { getMainBooruClient } from '../booru/booruclient';
import { formatBooruPostMessage } from '../booru/boorusend';
import type { ConverterPayload } from './converters';
import { ConverterEmptyPayload } from './converters';

const { error } = Logger('WARN', 'BoorutatoConvert');

export const acceptedBoorutatoConverters =  ['gelbooru'] as const;

export type AcceptedBoorutatoConverterKey = (typeof acceptedBoorutatoConverters)[number];

const gelbooruPostRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?<original>(?:(?:http:\/\/|https:\/\/))?(?:www\.)?gelbooru.com\/index\.php\?page=post(?:&[^\s&]*=[^\s&]*)*&id=(?<id>[0-9]+)(?:&[^\s&]*=[^\s&]*)*) ?(?<ed>(?:>|\|\|){0,2})/gi;

/**
 * @description Detecta enlaces de Gelbooru en un mensaje y los reenvía con un Embed corregido, a través de una respuesta.
 * @param message El mensaje a analizar
 * @param converterKeys Los identificadores de servicios de conversión a procesar
 */
export async function sendConvertedBooruPosts(
	message: Message<true>,
	converterKeys: Set<'gelbooru'>,
): Promise<ConverterPayload> {
	if (converterKeys.size === 0) return ConverterEmptyPayload;

	const { content: messageContent, channel } = message;

	if (
		!message.guild.members.me
			?.permissionsIn(channel)
			.has(['SendMessages', 'ManageMessages', 'AttachFiles'])
	)
		return ConverterEmptyPayload;

	if (channel.type === ChannelType.PublicThread) {
		try {
			const { parent } = channel;
			if (
				parent?.type === ChannelType.GuildForum
				&& (await channel.fetchStarterMessage())?.id === message.id
			)
				return ConverterEmptyPayload;
		} catch (err) {
			error(err);
			return ConverterEmptyPayload;
		}
	}

	const gelbooruUrls = [...messageContent.matchAll(gelbooruPostRegex)]
		.filter((u) => !(u.groups?.st?.includes('<') && u.groups.ed?.includes('>')))
		.slice(0, 16);

	if (!gelbooruUrls.length) return ConverterEmptyPayload;

	const booru = getMainBooruClient();

	const formattedGelbooruUrls: string[] = [];
	const containers: ContainerBuilder[] = [];

	for (const gelbooruMatch of gelbooruUrls) {
		const { st = '', original = '', id, ed = '' } = gelbooruMatch.groups ?? {};

		const post = await booru.fetchPostById(id);
		if (!post) continue;

		const spoiler = st.includes('||') && ed.includes('||') ? '||' : '';
		const formattedGelbooruUrl = `${spoiler}<:gelbooru:919398540172750878>[\`${id}\`](${original})${spoiler}`;

		const container = await formatBooruPostMessage(booru, post, {
			maxTags: 0,
			manageableBy: message.author.id,
			allowNSFW: isNSFWChannel(message.channel),
			isNotFeed: true,
		});

		formattedGelbooruUrls.push(formattedGelbooruUrl);
		containers.push(container);
	}

	const content = formattedGelbooruUrls.join(' ');

	return {
		contentful: true,
		flags: MessageFlags.IsComponentsV2,
		components: [new TextDisplayBuilder().setContent(content), ...containers],
	};
}
