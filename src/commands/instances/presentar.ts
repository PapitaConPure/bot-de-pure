import { ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags } from 'discord.js';
import { tenshiAltColor, tenshiColor } from '@/data/globalProps';
import userIds from '@/data/userIds.json';
import { Translator } from '@/i18n';
import { getBotEmoji } from '@/utils/emojis';
import { Command, CommandTags, commandFilenames } from '../commons';

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'presentar',
		en: 'showcase',
		ja: 'intro',
	},
	tags,
)
	.setAliases('presentacion', 'presentación', 'hola', 'saludar', 'presentarse', 'puré', 'pure')
	.setDescription('Me presento y digo cositas sobre mí~')
	.setExecution(async (request) => {
		const translator = await Translator.from(request);
		const papita = await request.client.users.fetch(userIds.papita);
		const counts = {
			commands: commandFilenames.length,
			guilds: request.client.guilds.cache.size,
		};

		const components = [
			new ContainerBuilder()
				.setAccentColor(tenshiColor)
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									'-# **𝓔𝓷𝓲𝓰𝓶𝓪𝓽𝓲𝓬 𝓜𝓪𝓬𝓱𝓲𝓷𝓮𝓻𝔂 𝓸𝓯 𝓗𝓲𝓰𝓱𝓮𝓼𝓽 𝓑𝓱𝓪𝓿𝓪-𝓪𝓰𝓻𝓪**',
								),
							(textDisplay) =>
								textDisplay.setContent('# ¡Hola! ¡Permíteme presentarme!'),
							(textDisplay) =>
								textDisplay.setContent(
									[
										'Me llamo __Bot de Puré__ (♀️). Soy una bot de administración, entretenimiento, utilidad general y búsqueda de imágenes.',
										'¡No dudes en investigar lo que puedo hacer! Al menos una risa te vas a llevar.',
									].join('\n'),
								),
						)
						.setThumbnailAccessory((thumbnail) =>
							thumbnail.setURL('https://i.imgur.com/3Dp8zFa.jpg'),
						),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						[
							'### -# Comandos',
							translator.getText(
								'estadoCommandsAndServersCount',
								counts.commands,
								counts.guilds,
							),
						].join('\n'),
					),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((textDisplay) =>
							textDisplay.setContent(
								['### -# Comprueba mi estado', '`p!estado` `/estado`'].join('\n'),
							),
						)
						.setButtonAccessory(
							new ButtonBuilder()
								.setCustomId('estado')
								.setEmoji('1458474431839076569')
								.setLabel(translator.getText('buttonView'))
								.setStyle(ButtonStyle.Primary),
						),
				)
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents((textDisplay) =>
							textDisplay.setContent(
								['### -# Más información', '`p!ayuda` `/ayuda`'].join('\n'),
							),
						)
						.setButtonAccessory(
							new ButtonBuilder()
								.setCustomId('ayuda')
								.setEmoji('1458474431839076569')
								.setLabel(translator.getText('buttonView'))
								.setStyle(ButtonStyle.Primary),
						),
				),
			new ContainerBuilder()
				.setAccentColor(tenshiAltColor)
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						[
							'## Créditos',
							'Todas estas personas hicieron posible el proyecto de Bot de Puré. ¡Gracias!',
						].join('\n'),
					),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									translator.getText('presentarBotOwnerEpigrapgh'),
								),
							(textDisplay) => textDisplay.setContent(`## 🥔 ${papita.displayName}`),
							(textDisplay) =>
								textDisplay.setContent(
									[`🆔 \`${papita.id}\``, `#️⃣ \`${papita.username}\``].join('\n'),
								),
						)
						.setThumbnailAccessory((accessory) =>
							accessory
								.setDescription(
									translator.getText('avatarGlobalAvatarAlt', papita.displayName),
								)
								.setURL(papita.displayAvatarURL({ extension: 'png', size: 1024 })),
						),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addSectionComponents((section) =>
					section
						.addTextDisplayComponents(
							(textDisplay) =>
								textDisplay.setContent(
									translator.getText('presentarArtistEpigrapgh'),
								),
							(textDisplay) => textDisplay.setContent('## 🍑 rakkidei'),
							(textDisplay) =>
								textDisplay.setContent(
									[
										`${getBotEmoji('pixivFullColor')} [\`rakkidei\`](https://www.pixiv.net/en/users/58442175 "Contiene enlaces a sus otras redes")`,
										`${getBotEmoji('twitterFullColor')} [\`@rakkidei\`](https://x.com/rakkidei "@rakkidei")`,
									].join(' '),
								),
						)
						.setThumbnailAccessory((accessory) =>
							accessory
								.setDescription(
									translator.getText('avatarGlobalAvatarAlt', 'rakkidei'),
								)
								.setURL('https://files.catbox.moe/q6e3qx.png'),
						),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						['-# Participantes', '🤠 `imbreaker.`', '🍗 `sassafras_doya`'].join('\n'),
					),
				)
				.addSeparatorComponents((separator) => separator.setDivider(true))
				.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent(
						['-# Colaboradores', '🧐 `superarathys12`', '🐶 `taton`'].join('\n'),
					),
				),
		];

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components,
			allowedMentions: {},
		});
	});

export default command;
