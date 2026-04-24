import {
	ActionRowBuilder,
	type AnyThreadChannel,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	type Collection,
	type Client as DiscordClient,
	type Guild,
	type GuildBasedChannel,
	type GuildMember,
	type GuildTextBasedChannel,
	type Message,
	type Role,
	StringSelectMenuBuilder,
	type User,
} from 'discord.js';
import { ClientNotFoundError, client } from '@/core/client';
import { globalConfigs } from '@/data/globalProps';
import { getBotEmojiResolvable } from './emojis';
import { levenshteinDistance } from './misc';
import { fetchUserCache } from './usercache';

export function extractUserID(data: string): string {
	if (data.startsWith('<@') && data.endsWith('>')) {
		data = data.slice(2, -1);
		if (data.startsWith('!')) data = data.slice(1);
	}
	return data;
}

interface MemberMatch {
	member: GuildMember;
	rawTarget: string;
	length: number;
	matchIndex: number;
}

function memberMatchComparer(a: MemberMatch, b: MemberMatch): number {
	//Favorecer coincidencia temprana
	if (a.matchIndex < b.matchIndex) return -1;
	if (a.matchIndex > b.matchIndex) return 1;

	//Favorecer nombre corto
	if (a.length < b.length) return -1;
	if (a.length > b.length) return 1;

	//Favorecer orden lexicográfico
	if (a.rawTarget < b.rawTarget) return -1;
	if (a.rawTarget > b.rawTarget) return 1;

	return 0;
}

export function findMemberByUsername(
	members: Collection<string, GuildMember>,
	query: string,
): GuildMember | undefined {
	const processedMembers = members.map((m) => ({
		member: m,
		rawTarget: m.user.username,
		length: m.user.username.length,
		matchIndex: m.user.username.toLowerCase().indexOf(query),
	}));

	const qualifiedMembers = processedMembers.filter((m) => m.matchIndex !== -1);
	if (qualifiedMembers.length) {
		qualifiedMembers.sort(memberMatchComparer);
		return qualifiedMembers[0]?.member;
	}

	return undefined;
}

export function findMemberByNickname(
	members: Collection<string, GuildMember>,
	query: string,
): GuildMember | undefined {
	const processedMembers = members
		.filter((m) => m.nickname)
		.map((m: GuildMember) => ({
			member: m,
			rawTarget: m.nickname as string,
			length: m.nickname?.length as number,
			matchIndex: m.nickname?.toLowerCase().indexOf(query) as number,
		}));

	const qualifiedMembers = processedMembers.filter((m) => m.matchIndex !== -1);
	if (qualifiedMembers.length) {
		qualifiedMembers.sort(memberMatchComparer);
		return qualifiedMembers[0]?.member;
	}

	return undefined;
}

export function findMemberByGlobalName(
	members: Collection<string, GuildMember>,
	query: string,
): GuildMember | undefined {
	const processedMembers = members
		.filter((m) => m.user.globalName)
		.map((m) => ({
			member: m,
			rawTarget: m.user.globalName as string,
			length: m.user.globalName?.length as number,
			matchIndex: m.user.globalName?.toLowerCase().indexOf(query) as number,
		}));

	const qualifiedMembers = processedMembers.filter((m) => m.matchIndex !== -1);
	if (qualifiedMembers.length) {
		qualifiedMembers.sort(memberMatchComparer);
		return qualifiedMembers[0]?.member;
	}

	return undefined;
}

/**
 * @description
 * Busca miembros de Discord según la consulta y el contexto proporcionados.
 *
 * Devuelve el {@link GuildMember miembro} de mayor coincidencia.
 * Si no se encuentra ningún miembro, se devuelve `undefined`.
 * @param query La consulta a realizar para obtener un miembro.
 * @param context El contexto del cuál obtener un miembro con la consulta.
 * @returns El miembro encontrado.
 */
export function fetchMember(
	query: GuildMember | string,
	context?: FetchUserContext,
): GuildMember | undefined {
	if (!query) throw new Error('fetchMember: Se requiere un criterio de búsqueda');

	if (typeof query !== 'string') return query.user?.username ? query : undefined;

	const { guild: thisGuild, client } = context ?? {};
	if (!thisGuild || !client)
		throw new Error('Se requieren la guild actual y el cliente en búsqueda de miembro');

	//Prioridad 1: Intentar encontrar por ID
	const allGuilds = client.guilds.cache;
	const otherGuilds = allGuilds.filter((g) => g.id !== thisGuild.id);
	query = extractUserID(query);

	if (!Number.isNaN(+query)) {
		return (
			thisGuild.members.cache.find((m) => m.id === query)
			?? otherGuilds
				.map((guild) => guild.members.cache.find((m) => m.id === query))
				.find((m) => m)
			?? undefined
		);
	}

	//Prioridad 2: Intentar encontrar por nombres (este server)
	const lowerQuery = (query as string).toLowerCase();
	const thisGuildMembers = thisGuild.members.cache;
	const memberInThisGuild =
		findMemberByGlobalName(thisGuildMembers, lowerQuery)
		?? findMemberByUsername(thisGuildMembers, lowerQuery)
		?? findMemberByNickname(thisGuildMembers, lowerQuery);

	if (memberInThisGuild) return memberInThisGuild;

	//Prioridad 3: Intentar encontrar por nombres (otros servers)
	const otherGuildsMembers = otherGuilds.flatMap((g) => g.members.cache);
	const memberInOtherGuilds =
		findMemberByGlobalName(otherGuildsMembers, lowerQuery)
		?? findMemberByUsername(otherGuildsMembers, lowerQuery)
		?? findMemberByNickname(otherGuildsMembers, lowerQuery);

	if (memberInOtherGuilds) return memberInOtherGuilds;

	return undefined;
}

interface FetchUserContext {
	guild?: Guild;
	client?: DiscordClient;
}

/**
 * @description
 * Busca usuarios de Discord según la consulta y el contexto proporcionados.
 *
 * Devuelve el {@link User usuario} de mayor coincidencia.
 * Si no se encuentra ningún usuario, se devuelve `undefined`.
 * @param query La consulta a realizar para obtener un usuario.
 * @param context El contexto del cuál obtener un usuario con la consulta.
 * @returns El usuario encontrado.
 */
export function fetchUser(query: User | string, context?: FetchUserContext): User | undefined {
	if (!query) throw new Error('fetchUser: Se requiere un criterio de búsqueda');

	if (typeof query !== 'string') return query.username ? query : undefined;

	const { guild: thisGuild, client } = context ?? {};
	if (!query || !thisGuild || !client)
		throw new Error('Se requieren la guild actual y el cliente en búsqueda de usuario');

	//Prioridad 1: Intentar encontrar por ID
	const usersCache = client.users.cache;
	query = extractUserID(query);

	if (!Number.isNaN(+query)) return usersCache.find((u) => u.id === query);

	//Prioridad 2: Intentar encontrar por nombres (este server)
	const lowerQuery = (query as string).toLowerCase();
	const thisGuildMembers = thisGuild.members.cache;
	const memberInThisGuild =
		findMemberByGlobalName(thisGuildMembers, lowerQuery)
		?? findMemberByUsername(thisGuildMembers, lowerQuery)
		?? findMemberByNickname(thisGuildMembers, lowerQuery);

	if (memberInThisGuild) return memberInThisGuild.user;

	//Prioridad 3: Intentar encontrar por nombres (otros servers)
	const allGuilds = client.guilds.cache;
	const otherGuilds = allGuilds.filter((g) => g.id !== thisGuild.id);
	const otherGuildsMembers = otherGuilds.flatMap((g) => g.members.cache);
	const memberInOtherGuilds =
		findMemberByGlobalName(otherGuildsMembers, lowerQuery)
		?? findMemberByUsername(otherGuildsMembers, lowerQuery)
		?? findMemberByNickname(otherGuildsMembers, lowerQuery);

	if (memberInOtherGuilds) return memberInOtherGuilds.user;

	return undefined;
}

/**
 * @description
 * Busca un usuario basado en la data ingresada.
 *
 * Devuelve la ID del usuario que más coincide con el término de búsqueda y contexto actual (si se encuentra alguno).
 * Si no se encuentra ningún usuario, se devuelve `undefined`.
 * @param query La consulta a realizar para encontrar un usuario.
 * @param context El contexto del cuál obtener un usuario con la consulta.
 * @returns La ID del usuario encontrado.
 */
export async function fetchUserID(
	query: User | string,
	context: FetchUserContext,
): Promise<string | undefined> {
	const user = fetchUser(query, context);
	return user != null ? user.id : undefined;
}

/**
 * @description
 * Busca un servidor basado en la data ingresada.
 *
 * Devuelve el servidor que coincide con el término de búsqueda (si se encuentra alguno).
 * Si no se encuentra ningún servidor, se devuelve `undefined`.
 * @param query La consulta a realizar para obtener un servidor.
 * @returns El servidor encontrado.
 */
export async function fetchGuild(query: string): Promise<Guild | undefined> {
	if (typeof query !== 'string' || !query.length) return;

	if (!client) throw new ClientNotFoundError();

	if (!Number.isNaN(+query)) return client.guilds.cache.get(query) ?? client.guilds.fetch(query);

	let bestDistance = -1;
	return client.guilds.cache
		.reduce<Guild>((bestMatch, guild) => {
			const distance = levenshteinDistance(guild.name, query);

			if (bestMatch && distance < bestDistance) {
				bestDistance = distance;
				return guild;
			}

			return bestMatch;
		}, undefined)
		.fetch();
}

/**
 * @description
 * Busca un canal basado en la data ingresada.
 *
 * Devuelve el canal que coincide con el término de búsqueda y contexto actual (si se encuentra alguno).
 * Si no se encuentra ningún canal, se devuelve `undefined`.
 * @param query La consulta a realizar para obtener un canal.
 * @param guild El servidor en el cual buscar el canal.
 * @returns El canal encontrado.
 */
export function fetchChannel(
	query: string | null | undefined,
	guild: Guild,
): GuildBasedChannel | undefined {
	if (typeof query !== 'string' || !query.length) return;

	const ccache = guild.channels.cache;
	if (query.startsWith('<#') && query.endsWith('>')) query = query.slice(2, -1);

	const channel =
		ccache.get(query)
		|| ccache
			.filter((c) => [ChannelType.GuildText, ChannelType.GuildVoice].includes(c.type))
			.find((c) => c.name.toLowerCase().includes(query));

	if (!channel) return;

	if (![ChannelType.GuildText, ChannelType.GuildVoice].includes(channel.type)) return;

	return channel;
}

interface FetchMessageContext {
	guild?: Guild;
	channel?: GuildTextBasedChannel;
}

/**
 * @description
 * Busca un mensaje basado en la data ingresada.
 *
 * Devuelve el mensaje que coincide con el término de búsqueda y contexto actual (si se encuentra alguno).
 * Si no se encuentra ningún mensaje, se devuelve `undefined`.
 * @param data Los datos a utilizar para encontrar un mensaje.
 * @param context El contexto del cuál obtener un mensaje con la consulta.
 * @returns El mensaje encontrado.
 */
export async function fetchMessage(
	data: string,
	context: FetchMessageContext = {},
): Promise<Message | undefined> {
	if (typeof data !== 'string' || !data.length) return;

	const acceptedChannelTypes = [
		ChannelType.GuildText,
		ChannelType.GuildVoice,
		ChannelType.PublicThread,
		ChannelType.PrivateThread,
		ChannelType.AnnouncementThread,
	];

	if (!context.channel || !acceptedChannelTypes.includes(context.channel?.type)) return;

	const messages = context.channel?.messages;
	const matchedUrl = data.match(/https:\/\/discord.com\/channels\/\d+\/\d+\/(\d+)/);
	const messageId = matchedUrl ? matchedUrl[1] : data;
	const message =
		messages.cache.get(messageId) || (await messages.fetch(messageId).catch((_) => _));

	if (!message?.channel) return;
	if (!acceptedChannelTypes.includes(message.channel.type)) return;
	return message;
}

/**
 * @description
 * Busca un rol basado en la data ingresada.
 *
 * Devuelve el rol que coincide con el término de búsqueda y contexto actual (si se encuentra alguno).
 * Si no se encuentra ningún rol, se devuelve `undefined`.
 * @param data Los datos a utilizar para encontrar un rol.
 * @param guild El servidor en el cual buscar el rol.
 * @returns El rol encontrado.
 */
export function fetchRole(data: string, guild: Guild): Role | undefined {
	if (typeof data !== 'string' || !data.length) return;

	const rcache = guild.roles.cache;
	if (data.startsWith('<@&') && data.endsWith('>')) data = data.slice(3, -1);
	const role =
		rcache.get(data)
		|| rcache
			.filter((r) => r.name !== '@everyone')
			.find((r) => r.name.toLowerCase().includes(data));
	if (!role) return;
	return role;
}

/**
 * @description RegEx para reconocer expresiones de emojis de Discord.
 *
 * @groups
 * * `name`: Nombre del emoji
 * * `id`: ID del emoji
 *
 * @example
 * ```
 * const sample = '<:emoji:123456789012345678>';
 * for(const emojiMatch of sample.matchAll(discordEmojiRegex) {
 *     console.log(emojiMatch.groups?.id); //123456789012345678
 * }
 * ```
 */
export const discordEmojiRegex = /<a?:(?<name>\w+):(?<id>[0-9]+)>/g;

export function isNSFWChannel(channel: GuildBasedChannel) {
	if (channel.isThread()) return channel.parent?.nsfw ?? false;

	if (!channel.isSendable()) return false;

	return channel.nsfw;
}
export function isThread(
	channel: GuildBasedChannel | AnyThreadChannel,
): channel is AnyThreadChannel {
	return [
		ChannelType.PublicThread,
		ChannelType.PrivateThread,
		ChannelType.AnnouncementThread,
	].includes(channel.type);
}

export function channelIsBlocked(channel: GuildTextBasedChannel | null) {
	if (!channel) return true;

	const member = channel.guild?.members.me;
	if (!member?.permissionsIn(channel)?.any?.(['SendMessages', 'SendMessagesInThreads'], true))
		return true;
	if (globalConfigs.maintenance.length === 0) return false;

	return globalConfigs.maintenance.startsWith('!')
		? channel.id === globalConfigs.maintenance.slice(1)
		: channel.id !== globalConfigs.maintenance;
}

export function isBoosting(member: GuildMember) {
	return !!member.roles.premiumSubscriberRole;
}

/**
 * @description
 * Agrega filas de control de navegación de páginas.
 *
 * Tanto `loadPage` como `loadPageExact` cumplen la función de ir a un número de página resaltado.
 * La diferencia es que en `loadPage` se extrae el número de página del primer argumento, y en `loadPageExact` se extrae de la opción seleccionada del SelectMenu
 *
 * Tanto `loadPage` como `loadPageExact` deberían de usar el decorador {@linkcode loadPageWrapper}
 *
 * Interacciones:
 *
 * ButtonInteraction `loadPage`
 * * `args[0]`: Número de página
 * * `args[1]`: Contexto del salto. Solo es necesario para que cada ID sea única.
 * * * `START`: "primera página"
 * * * `BACKWARD`: "página atrás"
 * * * `FORWARD`: "página delante"
 * * * `END`: "ultima página"
 * * * `RELOAD`: "actualizar"
 *
 * SelectMenuInteraction `loadPageExact`
 * * `.values[0]`: página seleccionada
 * @param commandFilename Nombre del archivo de comando
 * @param page Número de página actual
 * @param lastPage Número de última página
 */
export function navigationRows(commandFilename: string, page: number, lastPage: number) {
	const backward = page > 0 ? page - 1 : lastPage;
	const forward = page < lastPage ? page + 1 : 0;
	const maxGrowth = 12;
	const desiredMax = page + maxGrowth;
	const minPage = Math.max(0, page - maxGrowth - Math.max(0, desiredMax - lastPage));
	let i = minPage;

	return [
		new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`${commandFilename}_loadPage_0_START`)
				.setEmoji(getBotEmojiResolvable('navFirstAccent'))
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`${commandFilename}_loadPage_${backward}_BACKWARD`)
				.setEmoji(getBotEmojiResolvable('navPrevAccent'))
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`${commandFilename}_loadPage_${forward}_FORWARD`)
				.setEmoji(getBotEmojiResolvable('navNextAccent'))
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`${commandFilename}_loadPage_${lastPage}_END`)
				.setEmoji(getBotEmojiResolvable('navLastAccent'))
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`${commandFilename}_loadPage_${page}_RELOAD`)
				.setEmoji(getBotEmojiResolvable('refreshWhite'))
				.setStyle(ButtonStyle.Primary),
		),
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(`${commandFilename}_loadPageExact`)
				.setPlaceholder('Seleccionar página')
				.setOptions(
					Array(Math.min(lastPage + 1, 25))
						.fill(null)
						.map(() => ({
							value: `${i}`,
							label: `Página ${++i}`,
						})),
				),
		),
	];
}

export const isNotModerator = (member: GuildMember) =>
	!(member.permissions.has('ManageRoles') || member.permissions.has('ManageMessages'));

export async function isUsageBanned(user: User | GuildMember) {
	const userCache = await fetchUserCache(user);
	return userCache?.banned ?? false;
}
