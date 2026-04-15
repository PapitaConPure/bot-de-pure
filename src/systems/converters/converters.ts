import type {
	BitFieldResolvable,
	ContainerBuilder,
	MessageFlags,
	MessageFlagsString,
	TextDisplayBuilder,
} from 'discord.js';

export interface ConverterBasePayload<TContentful extends boolean> {
	contentful: TContentful;
}

export type EmptyConverterPayload = ConverterBasePayload<false>;

export interface ContentfulConverterPayloadData {
	content?: string;
	flags?: BitFieldResolvable<
		Extract<MessageFlagsString, 'SuppressEmbeds' | 'SuppressNotifications' | 'IsComponentsV2'>,
		| MessageFlags.SuppressEmbeds
		| MessageFlags.SuppressNotifications
		| MessageFlags.IsComponentsV2
	>;
	components?: (TextDisplayBuilder | ContainerBuilder)[];
}

export type ContentfulConverterPayload = ConverterBasePayload<true> &
	ContentfulConverterPayloadData;

export type ConverterPayload = EmptyConverterPayload | ContentfulConverterPayload;

export const ConverterEmptyPayload: ConverterPayload = {
	contentful: false,
};
