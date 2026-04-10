import type {
	ActionRowData,
	APIMessageTopLevelComponent,
	JSONEncodable,
	MessageActionRowComponentBuilder,
	MessageActionRowComponentData,
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
