import type { AttachmentBuilder, ContainerBuilder } from 'discord.js';
import { MessageFlags, TextDisplayBuilder } from 'discord.js';
import type { ConverterDefinition } from 'types/converters';
import { isNSFWChannel } from '@/utils/discord';
import { getBotEmoji } from '@/utils/emojis';
import { getMainBooruClient } from '../booru/booruclient';
import { formatBooruPostMessage } from '../booru/boorusend';

export const acceptedGelbooruConverters = ['boorutato', ''] as const;

export type AcceptedGelbooruConverterKey = (typeof acceptedGelbooruConverters)[number];

const gelbooruPostRegex =
	/(?<st>(?:<|\|\|){0,2}) ?(?<original>(?:(?:http:\/\/|https:\/\/))?(?:www\.)?gelbooru.com\/index\.php\?page=post(?:&[^\s&=]+=[^\s&=]+)*&id=(?<id>[0-9]+)(?:&[^\s&=]+=[^\s&=]+)*) ?(?<ed>(?:>|\|\|){0,2})/gi;

export const gelbooruConverter = {
	name: 'Gelbooru',
	regex: gelbooruPostRegex,
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
} satisfies ConverterDefinition;
