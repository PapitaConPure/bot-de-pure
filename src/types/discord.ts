import type {
	ActionRowData,
	APIMessageTopLevelComponent,
	BitFieldResolvable,
	JSONEncodable,
	MessageActionRowComponentBuilder,
	MessageActionRowComponentData,
	MessageFlags,
	MessageFlagsString,
	SlashCommandAttachmentOption,
	SlashCommandBooleanOption,
	SlashCommandBuilder,
	SlashCommandChannelOption,
	SlashCommandIntegerOption,
	SlashCommandMentionableOption,
	SlashCommandNumberOption,
	SlashCommandRoleOption,
	SlashCommandStringOption,
	SlashCommandUserOption,
	TopLevelComponentData,
} from 'discord.js';

export type AnySlashCommandOption =
	| SlashCommandBooleanOption
	| SlashCommandChannelOption
	| SlashCommandIntegerOption
	| SlashCommandMentionableOption
	| SlashCommandNumberOption
	| SlashCommandRoleOption
	| SlashCommandStringOption
	| SlashCommandAttachmentOption
	| SlashCommandMentionableOption
	| SlashCommandUserOption;

export type SlashCommandBuilderAddFunctionName = keyof SlashCommandBuilder & `add${string}`;

export type MessageComponentDataResolvable =
	| JSONEncodable<APIMessageTopLevelComponent>
	| TopLevelComponentData
	| ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
	| APIMessageTopLevelComponent;

export type FixedBitFieldResolvable = BitFieldResolvable<
	Extract<
		MessageFlagsString,
		'SuppressEmbeds' | 'SuppressNotifications' | 'IsComponentsV2' | 'IsVoiceMessage'
	>,
	MessageFlags.SuppressEmbeds | MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2
>;
