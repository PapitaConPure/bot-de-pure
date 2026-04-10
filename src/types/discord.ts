import type { SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";

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
