import { createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas';
import chalk from 'chalk';
import {
	AttachmentBuilder,
	ContainerBuilder,
	type Guild,
	type GuildMember,
	MessageFlags,
	type User,
} from 'discord.js';
import { tenshiColor } from '@/data/globalProps';
import images from '@/data/images.json';
import { fetchGuildMembers } from '@/utils/guildratekeeper';

const concol = {
	orange: chalk.rgb(255, 140, 70),
	purple: chalk.rgb(158, 114, 214),
};

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
		const canvas = createCanvas(1275, 825);
		const ctx = canvas.getContext('2d');

		const [fondo] = await Promise.all([
			loadImage(images.announcements.welcome),
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
		const canvas = createCanvas(1500, 900);
		const ctx = canvas.getContext('2d');

		const [fondo] = await Promise.all([
			loadImage(images.announcements.farewell),
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

/**
 * @description
 * Se debe llamar {@link fetchGuildMembers} antes para obtener buenos resultados.
 */
export function calculateRealMemberCount(guild: Guild) {
	const members = guild.members.cache;
	return members.filter((member) => !member.user.bot).size;
}

interface CanvasTextDrawAreaOptions {
	halign?: CanvasTextAlign;
	valign?: CanvasTextBaseline;
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
	const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 1024 }));
	ctx.drawImage(avatar, xcenter - radius, ycenter - radius, radius * 2, radius * 2);
	ctx.restore();
}
