import {
	type AttachmentBuilder,
	ChannelType,
	type ContainerBuilder,
	type Message,
	MessageFlags,
	MessageFlagsBitField,
	TextDisplayBuilder,
} from 'discord.js';
import type { ConverterDefinition, ConverterPayload, ConverterResult } from 'types/converters';
import type { FixedBitFieldResolvable } from 'types/discord';
import Logger from '@/utils/logs';
import { ConverterEmptyPayload } from './commons';

const { error } = Logger('WARN', 'Converters');

const CONVERTER_LINKS_MAX = 16;

export async function processConverter(
	converter: ConverterDefinition,
	message: Message<true>,
	conversionKey: string,
): Promise<ConverterPayload> {
	if (conversionKey === '') return ConverterEmptyPayload;

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

	const linksMatch = [...messageContent.matchAll(converter.regex)]
		.filter((u) => !(u[0].startsWith('<') && u[0].endsWith('>')))
		.slice(0, CONVERTER_LINKS_MAX);

	if (!linksMatch.length) return ConverterEmptyPayload;

	const { native, external } = converter;

	if (external != null) {
		const service = external.services[conversionKey];
		const serviceLink = service?.link;
		const result = await external.convert(linksMatch, { message, serviceLink });
		if (!isContentfulResult(result)) return ConverterEmptyPayload;
		return { contentful: true, ...result };
	}

	if (native == null) {
		error(new Error(`Converter "${converter.name}" has no conversion methods.`));
		return ConverterEmptyPayload;
	}

	if (native.key !== conversionKey) return ConverterEmptyPayload;

	const result = await native.convert(linksMatch, { message, serviceLink: undefined });

	if (!isContentfulResult(result)) return ConverterEmptyPayload;

	return { contentful: true, ...result };
}

export async function mergeConverterPayloads(
	payloads: (Promise<ConverterPayload> | ConverterPayload)[],
): Promise<ConverterPayload> {
	const converterPayloads = await Promise.all(payloads);

	if (converterPayloads.length === 0) return ConverterEmptyPayload;
	if (converterPayloads.length === 1) return converterPayloads[0];

	const contentfulPayloads = converterPayloads.filter((r) => r.contentful);
	if (!contentfulPayloads.length) return ConverterEmptyPayload;

	const mergedFlags = new MessageFlagsBitField(0);
	const mergedComponents: (TextDisplayBuilder | ContainerBuilder)[] = [];
	const mergedFiles: AttachmentBuilder[] = [];
	const contentFragments: string[] = [];

	for (const payload of contentfulPayloads) {
		if (payload.flags != null) mergedFlags.add(new MessageFlagsBitField(+payload.flags));
		if (payload.components?.length) mergedComponents.push(...payload.components);
		if (payload.files?.length) mergedFiles.push(...payload.files);
		if (payload.content) contentFragments.push(payload.content);
	}

	const mergedContent = contentFragments.join(' ');

	if (!mergedFlags.has(MessageFlags.IsComponentsV2)) {
		return {
			contentful: true,
			flags: mergedFlags as FixedBitFieldResolvable,
			content: `-# ${mergedContent}`,
		};
	}

	const finalComponents = mergedContent
		? [new TextDisplayBuilder().setContent(mergedContent), ...mergedComponents]
		: mergedComponents;

	return {
		contentful: true,
		flags: mergedFlags as FixedBitFieldResolvable,
		components: finalComponents,
		files: mergedFiles,
	};
}

function isContentfulResult(result: ConverterResult | undefined) {
	if (result == null) return false;
	return !!(result.content?.trim() || result.components?.length || result.files?.length);
}
