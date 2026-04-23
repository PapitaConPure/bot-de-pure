import Canvas, { type SKRSContext2D } from '@napi-rs/canvas'; //Node Canvas
import chalk from 'chalk';
import type {
	AnyThreadChannel,
	Collection,
	Client as DiscordClient,
	Guild,
	GuildBasedChannel,
	GuildMember,
	GuildTextBasedChannel,
	Message,
	Role,
	User,
} from 'discord.js';
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ContainerBuilder,
	MessageFlags,
	StringSelectMenuBuilder,
} from 'discord.js';
import { ClientNotFoundError, client } from './core/client';
import { globalConfigs, tenshiColor } from './data/globalProps';
import images from './data/images.json';
import { Translator } from './i18n';
import { getBotEmojiResolvable } from './utils/emojis';
import { fetchGuildMembers } from './utils/guildratekeeper';
import { fetchUserCache } from './utils/usercache';

const concol = {
	orange: chalk.rgb(255, 140, 70),
	purple: chalk.rgb(158, 114, 214),
};

//WARNING: Esta función permanece por compatibilidad. NO TOCAR
/**@deprecated*/
export function paginateRaw<T>(array: Collection<string, T>, pagemax?: number): [string, T][][];
/**@deprecated*/
export function paginateRaw<T>(array: T[], pagemax?: number): T[][];
/**@deprecated*/
export function paginateRaw<T>(
	values: T[] | Collection<string, T>,
	pagemax: number,
): T[][] | [string, T][][];
export function paginateRaw<T>(
	values: T[] | Collection<string, T>,
	pagemax: number = 10,
): T[][] | [string, T][][] {
	if (!Array.isArray(values)) {
		const intermediate = [...values.entries()];
		//@ts-expect-error
		return intermediate
			.map((_, i) => (i % pagemax === 0 ? intermediate.slice(i, i + pagemax) : null))
			.filter((item) => item);
	}

	//@ts-expect-error
	return values
		.map((_, i) => (i % pagemax === 0 ? values.slice(i, i + pagemax) : null))
		.filter((item) => item);
}

/**@description Crea una promesa que dura la cantidad de milisegundos indicados.*/
export function sleep(ms: number): Promise<void> {
	if (typeof ms !== 'number')
		throw 'Se esperaba un número de milisegundos durante el cuál esperar';
	return new Promise((resolve) => setTimeout(resolve, ms));
}

//#region Comprobadores
export const isNotModerator = (member: GuildMember) =>
	!(member.permissions.has('ManageRoles') || member.permissions.has('ManageMessages'));

export async function isUsageBanned(user: User | GuildMember) {
	const userCache = await fetchUserCache(user);
	return userCache?.banned ?? false;
}

export function isBoosting(member: GuildMember) {
	return !!member.roles.premiumSubscriberRole;
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
//#endregion

//#region Anuncios
/**
 * @description
 * Se debe llamar {@link fetchGuildMembers} antes para obtener buenos resultados.
 */
export function calculateRealMemberCount(guild: Guild) {
	const members = guild.members.cache;
	return members.filter((member) => !member.user.bot).size;
}

interface CanvasTextDrawAreaOptions {
	halign?: Canvas.CanvasTextAlign;
	valign?: Canvas.CanvasTextBaseline;
	maxSize?: number;
}
interface CanvasTextDrawFillOptions {
	enabled?: boolean;
	onTop?: boolean;
	color?: string;
}
interface CanvasTextDrawStrokeOptions {
	widthAsFactor?: boolean;
	width?: number;
	color?: string;
}
interface CanvasTextDrawFontOptions {
	family?: 'headline';
	size?: number;
	styles?: Array<'regular' | 'bold' | 'italic' | 'underline'>;
}
interface CanvasTextDrawOptions {
	area?: CanvasTextDrawAreaOptions;
	fill?: CanvasTextDrawFillOptions;
	stroke?: CanvasTextDrawStrokeOptions;
	font?: CanvasTextDrawFontOptions;
}

/**
 * @description Dibuja un avatar circular con Node Canvas.
 * @param ctx El Canvas context2D utilizado
 * @param x La posición X del origen del texto
 * @param y La posición Y del origen del texto
 * @param text El usuario del cual dibujar la foto de perfil
 * @param options Opciones de renderizado de texto
 */
export function drawText(
	ctx: SKRSContext2D,
	x: number,
	y: number,
	text: string,
	options: CanvasTextDrawOptions = {},
): void {
	//Parámetros opcionales
	options.area ??= {};
	options.area.halign ??= 'left';
	options.area.valign ??= 'top';
	options.area.maxSize ??= ctx.canvas.width;

	options.fill ??= {};
	options.fill.enabled ??= true;
	options.fill.onTop ??= true;
	options.fill.color ??= '#ffffff';

	options.stroke ??= {};
	options.stroke.widthAsFactor ??= false;
	options.stroke.width ??= 0;
	options.stroke.color ??= '#000000';

	options.font ??= {};
	options.font.family ??= 'headline';
	options.font.size ??= 12;
	options.font.styles ??= ['regular'];

	const { halign, valign, maxSize } = options.area;
	const { enabled: fillEnabled, onTop: fillOnTop, color: fillColor } = options.fill;
	const {
		color: strokeColor,
		width: strokeWidth,
		widthAsFactor: strokeWidthAsFactor,
	} = options.stroke;
	const { family: fontFamily, size: fontSize, styles: fontStyles } = options.font;

	ctx.textAlign = halign;
	ctx.textBaseline = valign;

	const dynamicStepSize = 2;
	let dynamicFontSize = fontSize + dynamicStepSize;
	do
		// biome-ignore lint/suspicious/noAssignInExpressions: Calcular tamaño de fuente en una sola expresión
		ctx.font = `${fontStyles.join(' ')} ${(dynamicFontSize -= dynamicStepSize)}px "${fontFamily}"`;
	while (ctx.measureText(text).width > maxSize);

	const fill = () => {
		ctx.fillStyle = fillColor;
		ctx.fillText(text, x, y);
	};
	const stroke = () => {
		ctx.lineWidth = Math.ceil(
			strokeWidthAsFactor ? Math.ceil(fontSize * strokeWidth) : strokeWidth,
		);
		ctx.strokeStyle = strokeColor;
		ctx.strokeText(text, x, y);
	};

	if (fillEnabled && !fillOnTop) fill();

	if (strokeWidth > 0) stroke();

	if (fillEnabled && fillOnTop) fill();
}

interface CanvasAvatarDrawOptions {
	circleStrokeColor?: string;
	circleStrokeFactor?: number;
}

export async function drawCircularImage(
	ctx: SKRSContext2D,
	user: User,
	xcenter: number,
	ycenter: number,
	radius: number,
	options: CanvasAvatarDrawOptions = {},
): Promise<void> {
	options.circleStrokeColor ??= '#000000';
	options.circleStrokeFactor ??= 0.02;

	//Fondo
	ctx.fillStyle = '#36393f';
	ctx.arc(xcenter, ycenter, radius, 0, Math.PI * 2, true);
	ctx.fill();

	//Foto de perfil
	ctx.strokeStyle = options.circleStrokeColor;
	ctx.lineWidth = radius * 0.33 * options.circleStrokeFactor;
	ctx.arc(xcenter, ycenter, radius + ctx.lineWidth, 0, Math.PI * 2, true);
	ctx.stroke();
	ctx.save();
	ctx.beginPath();
	ctx.arc(xcenter, ycenter, radius, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();
	const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 1024 }));
	ctx.drawImage(avatar, xcenter - radius, ycenter - radius, radius * 2, radius * 2);
	ctx.restore();
}

export async function sendWelcomeMessage(member: GuildMember) {
	if (member == null || typeof member !== 'object')
		throw ReferenceError('Se esperaba un miembro a cual dar la bienvenida.');

	const { guild, user, displayName } = member;

	if (guild.systemChannel == null) {
		guild.fetchOwner().then((ow) =>
			ow.user.send({
				content:
					'¡Hola, soy Bot de Puré!\n'
					+ `¡Un nuevo miembro, **${member} (${member.user.username} / ${member.id})**, ha entrado a tu servidor **${guild.name}**!\n\n`
					+ '*Si deseas que envíe una bienvenida a los miembros nuevos en lugar de enviarte un mensaje privado, selecciona un canal de mensajes de sistema en tu servidor.*\n'
					+ '-# Nota: Bot de Puré no opera con mensajes privados.',
			}),
		);
		return;
	}

	const channel = guild.systemChannel;

	if (!guild.members.me?.permissionsIn(channel).has(['SendMessages', 'ViewChannel'])) return;

	console.log(concol.purple`Un usuario ha entrado a ${guild.name}...`);

	await channel.sendTyping();

	try {
		//Crear la imagen de bienvenida
		const canvas = Canvas.createCanvas(1275, 825);
		const ctx = canvas.getContext('2d');

		const [fondo] = await Promise.all([
			Canvas.loadImage(images.announcements.welcome),
			fetchGuildMembers(guild),
		]);
		ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

		const strokeFactor = 0.09;
		const maxSize = canvas.width * 0.9;
		const vmargin = 15;

		const defaultStroke: CanvasTextDrawStrokeOptions = {
			widthAsFactor: true,
			width: strokeFactor,
			color: '#000000',
		};

		const defaultFont: CanvasTextDrawFontOptions = {
			family: 'headline',
			size: 100,
			styles: ['bold'],
		};

		//Nombre del miembro
		drawText(ctx, canvas.width / 2, vmargin, `${displayName}`, {
			area: { halign: 'center', valign: 'top', maxSize },
			stroke: defaultStroke,
			font: defaultFont,
		});

		//Complemento encima del Nombre de Servidor
		drawText(ctx, canvas.width / 2, canvas.height - 105 - vmargin, '¡Bienvenid@ a', {
			area: { halign: 'center', valign: 'bottom', maxSize },
			stroke: { ...defaultStroke, width: 56 * strokeFactor },
			font: { ...defaultFont, size: 56 },
		});

		//Nombre de Servidor
		drawText(ctx, canvas.width / 2, canvas.height - vmargin, `${guild.name}!`, {
			area: { halign: 'center', valign: 'bottom', maxSize },
			stroke: defaultStroke,
			font: defaultFont,
		});

		//Foto de perfil
		await drawCircularImage(ctx, user, canvas.width / 2, (canvas.height - 56) / 2, 200, {
			circleStrokeFactor: strokeFactor,
		});

		const attachment = new AttachmentBuilder(canvas.toBuffer('image/webp'), {
			name: 'bienvenida.webp',
		});
		const memberCount = calculateRealMemberCount(guild);

		const container = new ContainerBuilder()
			.setAccentColor(tenshiColor)
			.addMediaGalleryComponents((mediaGallery) =>
				mediaGallery.addItems((item) =>
					item
						.setURL('attachment://bienvenida.webp')
						.setDescription('Imagen de bienvenida.'),
				),
			)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(
					[
						`¡Bienvenido al servidor **${displayName}**!`,
						`-# Ahora hay **${memberCount}** usuarios en el server.`,
					].join('\n'),
				),
			);

		return channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [container],
			files: [attachment],
		});
	} catch (err) {
		console.log(
			chalk.redBright.bold(
				'Ocurrió un problema al intentar enviar un mensaje de bienvenida:',
			),
		);
		console.error(err);
	}
}

export async function sendFarewellMessage(member: GuildMember) {
	const { guild } = member;
	const channel = guild.systemChannel;

	if (!channel) {
		console.log('El servidor no tiene canal de mensajes de sistema.');
		return;
	}

	console.log(`Un usuario ha salido de ${guild.name}...`);
	if (!guild.members.me?.permissionsIn(channel).has(['SendMessages', 'ViewChannel'])) {
		console.log('No se puede enviar un mensaje de despedida en este canal.');
		return;
	}

	await channel.sendTyping();

	try {
		//Crear imagen de despedida
		const canvas = Canvas.createCanvas(1500, 900);
		const ctx = canvas.getContext('2d');

		const [fondo] = await Promise.all([
			Canvas.loadImage(images.announcements.farewell),
			fetchGuildMembers(guild),
		]);
		ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

		const strokeFactor = 0.09;
		ctx.fillStyle = '#ffffff';
		ctx.strokeStyle = '#000000';

		//Nombre del usuario + despedida
		ctx.textBaseline = 'bottom';
		ctx.textAlign = 'center';
		const halfWidth = canvas.width / 2;
		const farewellText = `Adiós, ${member.displayName}`;
		const fontSize = 90;
		ctx.font = `bold ${fontSize}px "headline"`;
		ctx.lineWidth = Math.ceil(fontSize * strokeFactor);
		ctx.strokeText(farewellText, halfWidth, canvas.height - 40);
		ctx.fillText(farewellText, halfWidth, canvas.height - 40);

		//Foto de perfil
		await drawCircularImage(ctx, member.user, canvas.width / 2, 80 + 200, 200, {
			circleStrokeFactor: strokeFactor,
		});

		//Enviar imagen y mensaje extra
		const attachment = new AttachmentBuilder(canvas.toBuffer('image/webp'), {
			name: 'despedida.webp',
		});
		const members = guild.members.cache;
		const memberCount = members.filter((member) => !member.user.bot).size;

		const container = new ContainerBuilder()
			.setAccentColor(tenshiColor)
			.addMediaGalleryComponents((mediaGallery) =>
				mediaGallery.addItems((item) =>
					item
						.setURL('attachment://despedida.webp')
						.setDescription('Imagen de despedida.'),
				),
			)
			.addTextDisplayComponents((textDisplay) =>
				textDisplay.setContent(`*Ahora hay **${memberCount}** usuarios en el server.*`),
			);

		await channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [container],
			files: [attachment],
		});

		console.log('Despedida finalizada.');
	} catch (err) {
		console.log(chalk.redBright.bold('Error de despedida'));
		console.error(err);
	}
}
//#endregion

//#region Fetch
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
 * @param args An array of words, which may contain double-quote groups
 * @param i Index from which to extract a sentence, be it a single word or a group
 * @ignore This should never be used directly, because the class for addressing options already handles the intended use case of this function in a less confusing manner.
 */
export function fetchSentence(args: string[], i: number) {
	if (i == null || i >= args.length || args[i] == null) return undefined;

	if (!args[i].startsWith('"')) return args.splice(i, 1)[0];

	let last = i;
	while (last < args.length && !args[last].endsWith('"')) last++;

	const text = args
		.splice(i, last - i + 1)
		.join(' ')
		.slice(1);

	if (text.length === 0 || text === '"') return undefined;

	return text.endsWith('"') ? text.slice(0, -1) : text;
}
//#endregion

//#region Utilidades
const HTTP_ENTITIES = {
	nbsp: ' ',
	amp: '&',
	quot: '"',
	lt: '<',
	gt: '>',
	tilde: '~',
	apos: "'",
	'#039': "'",
	cent: '¢',
	pound: '£',
	euro: '€',
	yen: '¥',
	copy: '©',
	reg: '®',
	iexcl: '¡',
	brvbar: '¦',
	sect: '§',
	uml: '¨',
	not: '¬',
	deg: 'º',
	acute: '`',
	micro: 'µ',
	para: '¶',
	ordm: 'º',
	laquo: '«',
	raquo: '»',
	circ: '^',
} as const;

const HTTP_ENTITIES_REGEX = (() => {
	const keys = Object.keys(HTTP_ENTITIES).join('|');
	return new RegExp(`&(${keys});`, 'g');
})();

export function decodeEntities(encodedstring: string) {
	//Fuente: https://stackoverflow.com/questions/44195322/a-plain-javascript-way-to-decode-html-entities-works-on-both-browsers-and-node
	return encodedstring
		.replace(
			HTTP_ENTITIES_REGEX,
			(match, entity: keyof typeof HTTP_ENTITIES) => HTTP_ENTITIES[entity] ?? match,
		)
		.replace(/&#(\d+);/gi, (_, numStr) => {
			const num = parseInt(numStr, 10);
			return String.fromCharCode(num);
		});
}

export interface WeightedDecision<TValue> {
	value: TValue;
	weight: number;
}

/**
 * @description
 * Selects a value from a list of weighted options using a random distribution.
 *
 * Each option's probability is proportional to its `weight` relative to the total weight.
 * For example, an option with weight `2` is twice as likely to be selected as an option with weight `1`.
 * @param options An array of weighted options to choose from.
 * @returns The randomly selected value based on weight, or `undefined` if no options are provided.
 *
 * @example
 * const result = makeWeightedDecision([
 *   { value: 'common', weight: 80 },
 *   { value: 'rare', weight: 15 },
 *   { value: 'legendary', weight: 5 }
 * ]);
 *
 * // 'common' is most likely, 'legendary' is least likely
 * console.log(result);
 */
export function makeWeightedDecision<TValue = unknown>(
	options: WeightedDecision<TValue>[],
): TValue {
	//@ts-expect-error Simplemente devuelve la misma array
	if (!options.length) return options;

	const optionCount = options.length;

	let totalWeight = 0;
	for (const option of options) totalWeight += option.weight;

	if (totalWeight === 0) {
		const r = Math.floor(Math.random() * optionCount);
		return options[r].value;
	}

	let r = Math.random() * totalWeight;
	for (let i = 0; i < optionCount; i++) {
		if (r < options[i].weight) return options[i].value;
		else r -= options[i].weight;
	}

	return options[optionCount - 1].value;
}
//#endregion

//#region Otros
/**@description RegEx para reconocer emojis Unicode.*/
export const unicodeEmojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

/**@description Devuelve el primer emoji global encontrado en el string.*/
export function parseUnicodeEmoji(emoji: string): string | null {
	if (typeof emoji !== 'string') return null;
	return emoji.match(unicodeEmojiRegex)?.[0] ?? null; //Expresión RegExp cursed
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

/**
 * @pure
 * @description Devuelve el valor ingresado, restringido al rango facilitado.
 */
export function clamp(value: number, min: number, max: number) {
	if (min > max) {
		const temp = min;
		min = max;
		max = temp;
	}

	return Math.max(min, Math.min(value, max));
}

/**
 * @pure
 * @description Devuelve la mediana del conjunto especificado.
 */
export function median(...values: number[]) {
	if (!values.length) throw RangeError('Se esperaba al menos 1 número');
	values = values.sort((a, b) => a - b);
	const lowestHalf = Math.floor(values.length / 2);
	if (values.length % 2) return values[lowestHalf];
	return (values[lowestHalf] + values[lowestHalf + 1]) / 2;
}

/**
 * @description Devuelve un valor aleatorio entre 0 y otro valor.
 * @param maxExclusive Máximo valor; excluído del resultado. 1 por defecto.
 * @param [round=false] Si el número debería ser redondeado hacia abajo. `true` por defecto.
 */
export function rand(maxExclusive: number, round: boolean = true) {
	maxExclusive = +maxExclusive;
	const negativeHandler = maxExclusive < 0 ? -1 : 1;
	maxExclusive = maxExclusive * negativeHandler;
	const value =
		((globalConfigs.seed + maxExclusive * Math.random()) % maxExclusive) * negativeHandler;
	return round ? Math.floor(value) : value;
}

/**
 * @description Devuelve un valor aleatorio dentro de un rango entre 2 valores.
 * @param minInclusive Mínimo valor; puede ser incluído en el resultado.
 * @param maxExclusive Máximo valor; excluído del resultado.
 * @param round Si el número debería ser redondeado hacia abajo. `false` por defecto.
 */
export function randRange(minInclusive: number, maxExclusive: number, round: boolean = true) {
	minInclusive = 1 * minInclusive;
	maxExclusive = 1 * maxExclusive;
	const range = maxExclusive - minInclusive;
	const value = minInclusive + ((globalConfigs.seed + range * Math.random()) % range);
	return round ? Math.floor(value) : value;
}

/**@description Devuelve un elemento aleatorio dentro de la Array especificada.*/
export function randInArray<T>(array: T[]): T {
	if (!array.length) return undefined as T;
	const randomIndex = rand(array.length);
	return array[randomIndex];
}

/**@see {@link https://stackoverflow.com/a/2450976}*/
export function shuffleArray<T>(array: T[]): void {
	let currentIndex = array.length;

	while (currentIndex !== 0) {
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

export function subdivideArray<T>(array: T[], divisionSize: number): T[][] {
	if (!array.length) return [[]];

	const subdivided: T[][] = [];
	for (let i = 0; i * divisionSize < array.length; i++) {
		const j = i * divisionSize;
		subdivided[i] = array.slice(j, j + divisionSize);
	}
	return subdivided;
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

export const shortnumberNames = {
	es: [
		'millones',
		'miles de millones',
		'billones',
		'miles de billones',
		'trillones',
		'miles de trillones',
		'cuatrillones',
		'miles de cuatrillones',
		'quintillones',
		'miles de quintillones',
		'sextillones',
		'miles de sextillones',
		'septillones',
		'miles de septillones',
		'octillones',
		'miles de octillones',
		'nonillones',
		'miles de nonillones',
		'decillones',
		'miles de decillones',
		'undecillones',
		'miles de undecillones',
		'duodecillones',
		'miles de duodecillones',
		'tredecillones',
		'miles de tredecillones',
		'quattuordecillones',
		'miles de quattuordecillones',
		'quindecillones',
		'miles de quindecillones',
		'sexdecillones',
		'miles de sexdecillones',
	],
	en: [
		'millions',
		'billions',
		'trillions',
		'quadrillions',
		'quintillions',
		'sextillions',
		'septillions',
		'octillions',
		'nonillions',
		'decillions',
		'undecillions',
		'duodecillions',
		'tredecillions',
		'quattuordecillions',
		'quindecillions',
		'sexdecillions',
		'septendecillions',
		'octodecillions',
		'novemdecillions',
		'vigintillions',
		'unvigintillions',
		'duovigintillions',
		'trevigintillions',
		'quattuorvigintillions',
		'quinvigintillions',
		'sexvigintillions',
		'septenvigintillions',
		'octovigintillions',
		'novemvigintillions',
		'trigintillions',
		'untrigintillions',
		'duotrigintillions',
	],
	ja: [
		'millions',
		'billions',
		'trillions',
		'quadrillions',
		'quintillions',
		'sextillions',
		'septillions',
		'octillions',
		'nonillions',
		'decillions',
		'undecillions',
		'duodecillions',
		'tredecillions',
		'quattuordecillions',
		'quindecillions',
		'sexdecillions',
		'septendecillions',
		'octodecillions',
		'novemdecillions',
		'vigintillions',
		'unvigintillions',
		'duovigintillions',
		'trevigintillions',
		'quattuorvigintillions',
		'quinvigintillions',
		'sexvigintillions',
		'septenvigintillions',
		'octovigintillions',
		'novemvigintillions',
		'trigintillions',
		'untrigintillions',
		'duotrigintillions',
	],
} as const;

interface ImproveNumberOptions {
	appendOf?: boolean;
	shorten?: boolean;
	translator?: Translator;
	minDigits?: number;
}
/**
 * @pure
 * @param num El número a mejorarle la visibilidad
 * @param options Opciones para mejorar el número
 */
export function improveNumber(num: number | string, options: ImproveNumberOptions = {}): string {
	const {
		appendOf = false,
		shorten = false,
		translator = new Translator('es'),
		minDigits = 1,
	} = options;

	if (typeof num === 'string') num = parseFloat(num);

	if (Number.isNaN(num)) return '0';

	/**
	 * @param {number} n
	 * @param {Intl.numberFormatOptions} nopt
	 */
	const formatnumber = (n: number, nopt: Intl.NumberFormatOptions = {}) =>
		n.toLocaleString(translator.locale, {
			maximumFractionDigits: 2,
			minimumIntegerDigits: minDigits,
			...nopt,
		});
	if (num < 1000000 || !shorten) return formatnumber(num);

	const ofPrefix = appendOf ? translator.getText('genericNumberOfPrefix') : '';
	const ofSuffix = appendOf ? translator.getText('genericNumberOfSuffix') : '';

	const obtainShortenednumber = () => {
		const googol = 10 ** 100;
		if (num >= googol)
			return `${formatnumber(num / googol, { maximumFractionDigits: 4 })} Gúgol`;

		const jesus = shortnumberNames[translator.locale];
		const ni =
			num < 10 ** (6 + jesus.length * 3)
				? Math.floor(
						(num.toLocaleString('fullwide', { useGrouping: false }).length - 7) / 3,
					)
				: jesus.length - 1;
		const snum = formatnumber(num / 1000 ** (ni + 2), { minimumFractionDigits: 2 });

		return [snum, jesus[ni]].join(' ');
	};

	return `${ofPrefix}${obtainShortenednumber()}${ofSuffix}`;
}

/**@pure */
export function quantityDisplay(num: number, translator: Translator) {
	return improveNumber(num, {
		appendOf: true,
		shorten: true,
		translator,
	});
}

/**@pure */
export function regroupText(arr: string[], sep = ',') {
	const sepRegex = new RegExp(`([\\n ]*${sep}[\\n ]*)+`, 'g');
	return arr
		.join(' ')
		.replace(sepRegex, sep)
		.split(sep)
		.filter((a) => a.length);
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres.
 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte.
 */
export function shortenText(
	text: string,
	max: number | null = 200,
	suspensor: string | null = '...',
): string {
	if (typeof text !== 'string') throw TypeError('El texto debe ser un string');
	if (typeof max !== 'number') throw TypeError('El máximo debe ser un número');
	if (typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');
	if (text.length < max) return text;
	return `${text.slice(0, max - suspensor.length)}${suspensor}`;
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres de forma floja (no recorta palabras).
 * Si el string sobrepasa el máximo establecido, se reemplaza el final por un string suspensor para indicar el recorte.
 */
export function shortenTextLoose(
	text: string,
	max: number | null = 200,
	hardMax: number | null = 256,
	suspensor: string | null = '...',
): string {
	if (typeof text !== 'string') throw TypeError('El texto debe ser un string');
	if (typeof max !== 'number') throw TypeError('El máximo debe ser un número');
	if (typeof hardMax !== 'number') throw TypeError('El máximo verdadero debe ser un número');
	if (typeof suspensor !== 'string') throw TypeError('El suspensor debe ser un string');

	if (text.length < max) return text;

	const trueMax = Math.min(text.length, hardMax);
	const whitespaces = [' ', '\n', '\t'];
	let calculatedMax = max;
	while (calculatedMax < trueMax && !whitespaces.includes(text[calculatedMax])) calculatedMax++;

	if (calculatedMax + suspensor.length > hardMax) calculatedMax = hardMax - suspensor.length;

	if (calculatedMax <= text.length) return text;

	return `${text.slice(0, calculatedMax)}${suspensor}`;
}

interface SmartShortenStructDefinition {
	start: string;
	end: string;
	dynamic: boolean;
}

interface SmartShortenOptions {
	max: number;
	hardMax: number;
	suspensor: string;
	structs: SmartShortenStructDefinition[];
}

/**
 * @description
 * Limita un string a una cantidad definida de caracteres de forma inteligente (no recorta palabras ni estructuras).
 */
export function shortenTextSmart(text: string, options: Partial<SmartShortenOptions>): string {
	options ??= {};
	options.max ??= 200;
	options.hardMax ??= 256;
	options.suspensor ??= '...';
	options.structs ??= [];
	const { max, hardMax, suspensor } = options;

	if (text.length < max) return text;

	const trueHardMax = Math.min(text.length, hardMax);

	const whitespaceOffset =
		/\s/.exec(text.slice(max, trueHardMax - suspensor.length))?.index ?? -1;
	const trueMax = max + (whitespaceOffset > 0 ? whitespaceOffset : 0);

	//PENDIENTE

	return `${text.slice(0, trueMax)}${suspensor}`;
}

/**@description Devuelve una representación del string ingresado con su primer caracter en mayúscula.*/
export const toCapitalized = (text: string) => `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;

interface LowerCaseNormalizationOptions {
	removeCarriageReturns?: boolean;
}

/**@description Obtiene una representación en minúsculas, normalizada y sin diacríticos del string ingresado.*/
export function toLowerCaseNormalized(
	text: string,
	options: LowerCaseNormalizationOptions = {},
): string {
	options.removeCarriageReturns ??= false;

	text = text
		.toLowerCase()
		.normalize('NFD')
		.replace(/([aeioun])[\u0300-\u030A]/gi, '$1');

	if (options.removeCarriageReturns) text = text.replace(/\r/g, '');

	return text;
}

/**
 * Calcula la distancia entre dos strings con el algoritmo de distancia Levenshtein.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshteinDistance(a: string, b: string): number {
	const m = a.length + 1;
	const n = b.length + 1;
	const distance = new Array(m);
	for (let i = 0; i < m; ++i) {
		distance[i] = new Array(n);
		for (let j = 0; j < n; ++j) distance[i][j] = 0;
		distance[i][0] = i;
	}

	for (let j = 1; j < n; j++) distance[0][j] = j;

	let cost: number;
	for (let i = 1; i < m; i++)
		for (let j = 1; j < n; j++) {
			cost = a.at(i - 1) === b.at(j - 1) ? 0 : 1;

			distance[i][j] = Math.min(
				distance[i - 1][j] + 1,
				distance[i][j - 1] + 1,
				distance[i - 1][j - 1] + cost,
			);
		}

	return distance[m - 1][n - 1];
}

/**
 * @description
 * Calcula la distancia entre dos strings con el algoritmo de distancia Damerau-Levenshtein + peso Euclideano según distancia entre teclas del teclado.
 *
 * Asume una distribución de teclado de tipo QWERTY en Español (España).
 */
export function edlDistance(a: string, b: string): number {
	const keyboardKeys = [
		[..."º1234567890'¡"],
		[...' qwertyuiop`+'],
		[...' asdfghjklñ´ç'],
		[...'<zxcvbnm,.-  '],
	];
	const shiftKeyboardKeys = [
		[...'ª!"·$%&/()=?¿'],
		[...'           ^*'],
		[...'           ¨Ç'],
		[...'>       ;:_  '],
	];
	const altKeyboardKeys = [
		[...'\\|@#~€¬      '],
		[...'           []'],
		[...'           {}'],
		[...'			 '],
	];

	const keyboardCartesians: Record<string, { x: number; y: number }> = {};
	function assignToPlane(x: number, y: number, c: string) {
		if (c == null) return;
		keyboardCartesians[c] = { x, y };
	}
	for (let j = 0; j < keyboardKeys.length; j++) {
		keyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
		shiftKeyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
		altKeyboardKeys[j].forEach((char, i) => assignToPlane(i, j, char));
	}
	assignToPlane(keyboardCartesians.b.x, keyboardCartesians.b.y + 1, 'SPACE');
	const centerCartesian = { x: parseInt(`${keyboardKeys[1].length * 0.5}`, 10), y: 1 };
	function euclideanDistance(a = 'g', b = 'h') {
		a = a.toLowerCase();
		b = b.toLowerCase();
		const aa =
			a === ' ' ? keyboardCartesians.SPACE : (keyboardCartesians[a] ?? centerCartesian);
		const bb =
			b === ' ' ? keyboardCartesians.SPACE : (keyboardCartesians[b] ?? centerCartesian);
		const x = (aa.x - bb.x) ** 2;
		const y = (aa.y - bb.y) ** 2;
		return Math.sqrt(x + y);
	}
	const normalizedEuclidean = euclideanDistance('w', 'd');
	const halfNormalizedEuclidean = normalizedEuclidean * 0.5;

	const m = a.length + 1;
	const n = b.length + 1;
	const distance = new Array(m).fill(null).map((element, i) => {
		element = new Array(n).fill(0);
		element[0] = i;
		return element as number[];
	});
	for (let j = 1; j < n; j++) distance[0][j] = j;

	for (let i = 1; i < m; i++)
		for (let j = 1; j < n; j++) {
			const aa = a.at(i - 1);
			const bb = b.at(j - 1);
			const cost = aa === bb ? 0 : 1;

			const deletion = distance[i - 1][j] + 1;
			const insertion = distance[i][j - 1] + 1;
			const substitution = distance[i - 1][j - 1] + cost;
			distance[i][j] = Math.min(deletion, insertion, substitution);

			if (a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
				distance[i][j] = Math.min(distance[i][j], distance[i - 2][j - 2] + 1);

			if (cost && substitution < insertion && substitution < deletion)
				distance[i][j] +=
					euclideanDistance(aa, bb) * halfNormalizedEuclidean - normalizedEuclidean;
		}

	return distance[m - 1][n - 1];
}

const digitsOf64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';

export function radix10to64(n: number, s: string = ''): string {
	const newKey = n % 64;
	const remainder = Math.floor(n / 64);
	const stack = digitsOf64[newKey] + s;
	return remainder <= 0 ? stack : radix10to64(remainder, stack);
}

export function radix64to10(s: string): number {
	const digits = s.split('');
	let result = 0;
	for (const e in digits) result = result * 64 + digitsOf64.indexOf(digits[e]);
	return result;
}

const digitsOf128 =
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/*ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÃÕáéíóúàèìòùäëïöüãõÑñÇçºª;:,.!·%¿?@#~€¬¨^<>';

export function radix10to128(n: number, s: string = ''): string {
	const newKey = n % 128;
	const remainder = Math.floor(n / 128);
	const stack = digitsOf128[newKey] + s;
	return remainder <= 0 ? stack : radix10to128(remainder, stack);
}

export function radix128to10(s: string): number {
	const digits = s.split('');
	let result = 0;
	for (const e in digits) result = result * 128 + digitsOf128.indexOf(digits[e]);
	return result;
}

export function fullToShortHour(hour: number) {
	if (hour < 1) return { value: 12, meridian: 'AM' as const };

	if (hour < 12) return { value: hour, meridian: 'AM' as const };

	return { value: hour - 12, meridian: 'PM' as const };
}

/**
 * @param date La fecha a la cual dar formato.
 * @param template La plantilla de formato para la fecha indicada.
 *
 * Ejemplos para la fecha: "Martes, 9 de abril de 2025, 2:48:06.092 PM", con el locale "es-ES"
 *   - yyyy: 2025
 *   - yy: 25
 *   - MMMM: Abril
 *   - MMM: Ene
 *   - MM: 04
 *   - M: 4
 *   - dddd: Martes
 *   - ddd: Mar
 *   - dd: 09
 *   - d: 9
 *   - hhhh: 2:48:06 PM
 *   - hhh: 2:48 PM
 *   - hh: 02
 *   - h: 2
 *   - HH: 14
 *   - H: 14
 *   - mm: 48
 *   - m: 48
 *   - ss: 06
 *   - s: 6
 *   - fff: 092
 *   - ff: 09
 *   - f: 1
 * @param locale Por ejemplo, "en-US" o "es-ES".
 */
export function dateToUTCFormat(date: Date, template: string, locale: string = 'en-US'): string {
	if (!(date instanceof Date)) throw new TypeError('Se esperaba un objeto Date');

	if (typeof template !== 'string' || !template.length)
		throw new TypeError('Se esperaba un string válido como plantilla de formato');

	const year = date.getUTCFullYear().toString();
	const month = (date.getUTCMonth() + 1).toString();
	const day = date.getUTCDate().toString();
	const hours = date.getUTCHours();
	const hoursInfo = fullToShortHour(hours);
	const minutes = date.getUTCMinutes().toString();
	const seconds = date.getUTCSeconds().toString();
	const milliseconds = date.getUTCMilliseconds().toString();

	const replacements: Record<string, string> = {
		yyyy: year,
		yy: year.slice(-2),
		MMMM: date.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' }),
		MMM: date.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }),
		MM: month.padStart(2, '0'),
		M: month,
		dddd: date.toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' }),
		ddd: date.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
		dd: day.padStart(2, '0'),
		d: day,
		hhhh: `${hoursInfo.value.toString()}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')} ${hoursInfo.meridian}`,
		hhh: `${hoursInfo.value.toString()}:${minutes.padStart(2, '0')} ${hoursInfo.meridian}`,
		hh: hoursInfo.value.toString().padStart(2, '0'),
		h: hoursInfo.value.toString(),
		HH: hours.toString().padStart(2, '0'),
		H: hours.toString(),
		mm: minutes.padStart(2, '0'),
		m: minutes,
		ss: seconds.padStart(2, '0'),
		s: seconds,
		fff: milliseconds.padStart(3, '0'),
		ff: milliseconds.slice(0, 2).padStart(2, '0'),
		f: milliseconds.slice(0, 1),
	};

	let formatted = template;

	for (const key in replacements) {
		const regex = new RegExp(`\\b${key}\\b`, 'g');
		const replacement: string = replacements[key];
		formatted = formatted.replace(regex, replacement);
	}

	return formatted;
}

/**
 * @description
 * Comprime un snowflake de Discord dividiéndolo en dos partes, convirtiéndolas a un sistema arbitrario de base 128 y concatenando el resultado.
 *
 * La longitud del segmento izquierdo comprimido se antepone al resultado para permitir su decodificación.
 */
export function compressId(id: string): string {
	if (typeof id !== 'string') throw Error('La id debe ser un string');

	let mid = Math.floor(id.length * 0.5);

	if (id[mid] === '0') mid = Math.floor(mid * 0.5) || 1;

	while (id[mid] === '0' && mid < id.length - 1) mid++;

	const left = id.slice(0, mid);
	const right = id.slice(mid);
	const compr = [left, right].map((str) => {
		const int = parseInt(str, 10);
		if (Number.isNaN(int))
			throw TypeError(
				`No se pudo convertir ${str} a un entero al intentar comprimir la id: ${id}`,
			);
		return radix10to128(int);
	});

	return compr[0].length + compr.join('');
}

/**@description Realiza el proceso inverso de la función de compresión: {@linkcode compressId}.*/
export function decompressId(id: string): string {
	if (typeof id !== 'string') throw Error('La id debe ser un string');

	const mid = id[0];
	id = id.slice(1);
	const left = id.slice(0, +mid);
	const right = id.slice(+mid);
	const decomp = [left, right].map((str) => radix128to10(str).toString());

	return decomp.join('');
}

export function stringHexToNumber(str: string): number {
	if (typeof str !== 'string')
		throw TypeError('Se esperaba un string de hexadecimal para convertir a número');

	if (!str.length) return 0;

	if (str.startsWith('#')) str = str.slice(1);

	return parseInt(`0x${str}`, 10);
}

/**
 * @description
 * Reduce la presición de un número a solo los dígitos especificados.
 *
 * Si la parte decimal tiene menos dígitos que lo especificado, se deja como está.
 */
export function toPrecision(num: number, precision: number) {
	if (typeof num !== 'number') throw TypeError('Se esperaba un número válido');
	if (typeof precision !== 'number') throw TypeError('La presición debe ser un número');
	if (precision < 0 || precision > 14)
		throw RangeError('La presición debe ser un número entre 0 y 14');

	const abs = ~~num;
	const decimal = num - abs;
	const squash = 10 ** precision;
	const reduced = Math.floor(decimal * squash) / squash;
	return abs + reduced;
}
//#endregion
