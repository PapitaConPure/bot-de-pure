import type { AttachmentBuilder, ContainerBuilder } from 'discord.js';
import { MessageFlags, TextDisplayBuilder } from 'discord.js';
import type { ConverterDefinition, ConverterService } from 'types/converters';
import { getMainBooruClient } from '@/systems/booru/booruclient';
import { formatBooruPostMessage } from '@/systems/booru/boorusend';
import { isNSFWChannel } from '@/utils/discord';
import { getBotEmoji } from '@/utils/emojis';

export const gelbooruConvertRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?<original>(?:(?:http:\/\/|https:\/\/))?(?:www\.)?gelbooru.com\/index\.php\?page=post(?:&[^\s&=]+=[^\s&=]+)*&id=(?<id>[0-9]+)(?:&[^\s&=]+=[^\s&=]+)*) ?(?<ed>(?:>|\|\|){0,2})/gi;

export const gelbooruConversionServices = {} as const satisfies Record<string, ConverterService>;
export type AcceptedGelbooruConverterKey = 'boorutato' | keyof typeof gelbooruConversionServices;

export const acceptedGelbooruConvertersWithoutNone = ['boorutato'] as const;
export const acceptedGelbooruConverters = ['', ...acceptedGelbooruConvertersWithoutNone] as const;

export const gelbooruConverter = {
	name: 'Gelbooru',
	regex: gelbooruConvertRegex,
	native: {
		key: 'boorutato',
		async convert(matchedLinks, { message }) {
			const booru = getMainBooruClient();
			if (!booru) return {};

			const formattedGelbooruUrls: string[] = [];
			const containers: ContainerBuilder[] = [];
			const files: AttachmentBuilder[] = [];

			for (const gelbooruMatch of matchedLinks) {
				const { st = '', original = '', id, ed = '' } = gelbooruMatch.groups ?? {};

				const post = await booru.fetchPostById(id);
				if (!post) continue;

				const spoiler = st.includes('||') && ed.includes('||') ? '||' : '';
				const formattedGelbooruUrl = `${spoiler}${getBotEmoji('gelbooruColor')}[\`${id}\`](${original})${spoiler}`;

				const { container, attachment } = await formatBooruPostMessage(booru, post, {
					maxGeneralTags: 0,
					manageableBy: message.author.id,
					allowNSFW: isNSFWChannel(message.channel),
					isNotFeed: true,
				});

				formattedGelbooruUrls.push(formattedGelbooruUrl);
				containers.push(container);
				if (attachment) files.push(attachment);
			}

			const content = formattedGelbooruUrls.join(' ');

			return {
				flags: MessageFlags.IsComponentsV2,
				components: [new TextDisplayBuilder().setContent(content), ...containers],
				files: files.length ? files : undefined,
			};
		},
	},
} as const satisfies ConverterDefinition;
