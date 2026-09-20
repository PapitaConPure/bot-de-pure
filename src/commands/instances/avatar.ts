import { createCanvas } from '@napi-rs/canvas';
import type { GuildMember, ImageURLOptions } from 'discord.js';
import { AttachmentBuilder, ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import type { ComplexCommandRequest } from 'types/commands';
import { tenshiColor } from '@/data/globalProps';
import { Translator } from '@/i18n';
import { getBotEmoji } from '@/utils/emojis';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandOptionSolver, CommandOptions, CommandTags } from '../commons';

const getAvatarPayload = (
	member: GuildMember,
	translator: Translator,
): { container: ContainerBuilder; attachment: AttachmentBuilder | null } => {
	const avatarURLDisplayOptions: ImageURLOptions = { size: 4096 };
	const bannerURLDisplayOptions: ImageURLOptions = { size: 4096 };
	const userAvatarURL = member.user.displayAvatarURL(avatarURLDisplayOptions);
	const userBannerURL = member.user.bannerURL(bannerURLDisplayOptions);
	const memberAvatarURL = member.displayAvatarURL(avatarURLDisplayOptions);
	const memberBannerURL = member.displayBannerURL(bannerURLDisplayOptions);
	const hasServerAvatarOverride = memberAvatarURL !== userAvatarURL;
	const hasServerBannerOverride = memberBannerURL !== userBannerURL;

	const themeColor = member.user.accentColor || member.displayColor || tenshiColor;
	const container = new ContainerBuilder().setAccentColor(themeColor);
	let attachment: AttachmentBuilder | null = null;

	if (userBannerURL)
		container.addMediaGalleryComponents((mediaGallery) =>
			mediaGallery.addItems((mediaGalleryItem) =>
				mediaGalleryItem
					.setDescription(
						translator.getText('avatarGlobalBannerAlt', member.user.displayName),
					)
					.setURL(userBannerURL),
			),
		);
	else {
		const canvas = createCanvas(640, 120);
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = `#${themeColor.toString(16)}`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		attachment = new AttachmentBuilder(canvas.toBuffer('image/webp'), {
			name: 'banner.webp',
		});
		container.addMediaGalleryComponents((mediaGallery) =>
			mediaGallery.addItems((mediaGalleryItem) =>
				mediaGalleryItem
					.setDescription('avatarGlobalBannerAlt')
					.setURL('attachment://banner.webp'),
			),
		);
	}

	container.addSectionComponents((section) =>
		section
			.addTextDisplayComponents(
				(textDisplay) =>
					textDisplay.setContent(translator.getText('avatarGlobalProfileEpigraph')),
				(textDisplay) => textDisplay.setContent(`## ${member.user.displayName}`),
				(textDisplay) =>
					textDisplay.setContent(
						[
							`${getBotEmoji('userAccent')} ${member.user}`,
							[
								`${getBotEmoji('urlAccent')} [${translator.getText('avatarAvatar')}](${userAvatarURL})`,
								userBannerURL
									? `${getBotEmoji('urlAccent')} [${translator.getText('avatarBanner')}](${userBannerURL})`
									: `${getBotEmoji('urlAccent')} ${translator.getText('avatarBannerNone')}`,
							].join('　'),
						].join('\n'),
					),
			)
			.setThumbnailAccessory((accessory) =>
				accessory
					.setDescription(
						translator.getText('avatarGlobalAvatarAlt', member.user.displayName),
					)
					.setURL(userAvatarURL),
			),
	);

	if (!hasServerAvatarOverride && !hasServerBannerOverride) return { container, attachment };

	//En caso de tener un override para el server
	container.addSeparatorComponents((separator) => separator.setDivider(true));

	const serverAvatarURLs: string[] = [];

	if (hasServerAvatarOverride)
		serverAvatarURLs.push(
			`${getBotEmoji('urlAccent')} [${translator.getText('avatarAvatar')}](${memberAvatarURL})`,
		);

	if (hasServerBannerOverride && memberBannerURL != null) {
		serverAvatarURLs.push(
			`${getBotEmoji('urlAccent')} [${translator.getText('avatarBanner')}](${memberBannerURL})`,
		);

		container.addMediaGalleryComponents((mediaGallery) =>
			mediaGallery.addItems((mediaGalleryItem) =>
				mediaGalleryItem
					.setDescription(translator.getText('avatarGuildBannerAlt', member.displayName))
					.setURL(memberBannerURL),
			),
		);
	} else
		serverAvatarURLs.push(
			`${getBotEmoji('urlAccent')} ${translator.getText('avatarBannerNone')}`,
		);

	const serverAvatarDetailsTextDisplay = [
		new TextDisplayBuilder().setContent(translator.getText('avatarGuildProfileEpigraph')),
		new TextDisplayBuilder().setContent(`## ${member.displayName}`),
		new TextDisplayBuilder().setContent(
			[
				translator.getText('avatarGuildProfileSource', member.guild),
				serverAvatarURLs.join('　'),
			].join('\n'),
		),
	];

	if (hasServerAvatarOverride)
		container.addSectionComponents((section) =>
			section
				.addTextDisplayComponents(serverAvatarDetailsTextDisplay)
				.setThumbnailAccessory((accessory) =>
					accessory
						.setDescription(
							translator.getText('avatarGuildAvatarAlt', member.displayName),
						)
						.setURL(memberAvatarURL),
				),
		);
	else container.addTextDisplayComponents(serverAvatarDetailsTextDisplay);

	return { container, attachment };
};

function getMembers(
	request: ComplexCommandRequest,
	args: CommandOptionSolver,
): { found: GuildMember[]; notFound: string[] } {
	const notFound: string[] = [];
	const members = CommandOptionSolver.asMembers(
		args.parsePolyParamSync('miembros', {
			fallback: request.member,
			regroupMethod: 'MENTIONABLES-WITH-SEP',
			failedPayload: notFound,
		}),
	);

	return {
		found: members as GuildMember[],
		notFound,
	};
}

const options = new CommandOptions().addParam(
	'miembros',
	'MEMBER',
	'para indicar miembros de los cuales obtener avatares',
	{ optional: true, poly: 'MULTIPLE', polymax: 10 },
);

const tags = new CommandTags().add('COMMON');

const command = new Command('avatar', tags)
	.setAliases('perfil', 'fotoperfil', 'profile', 'profilepicture', 'pfp', 'av')
	.setBriefDescription('Muestra tu propio avatar o el del usuario mencionado')
	.setLongDescription(
		'Muestra tu propio avatar o el del usuario mencionado',
		'Puedes buscar por ID, mención, etiqueta, nombre o apodo. Para búsquedas múltiples, separa los términos con comas',
		'Se priorizan resultados del servidor actual, pero la búsqueda tiene un rango de todos los servidores a los que tengo acceso',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const [translator] = await Promise.all([
			Translator.from(request),
			fetchGuildMembers(request.guild),
		]);

		const files: AttachmentBuilder[] = [];
		const components: (TextDisplayBuilder | ContainerBuilder)[] = [];
		const { found: members, notFound } = getMembers(request, args);

		if (notFound.length) {
			components.push(
				new TextDisplayBuilder().setContent(
					translator.getText(
						'avatarUserNotFoundNotice',
						notFound.join(', '),
						notFound.length,
						p_pure(request).raw,
					),
				),
			);
		}

		if (members.length) {
			const fetchedMembers = await Promise.all(members.map((m) => m.fetch(true)));
			fetchedMembers.forEach((member) => {
				const { container, attachment } = getAvatarPayload(member, translator);
				components.push(container);
				attachment && files.push(attachment);
			});
		}

		if (!components.length) {
			await request.member.fetch(true);
			const { container, attachment } = getAvatarPayload(request.member, translator);
			components.push(container);
			attachment && files.push(attachment);
		}

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components,
			files,
		});
	});

export default command;
