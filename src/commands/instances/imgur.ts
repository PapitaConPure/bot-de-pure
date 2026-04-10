import { ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder, LabelBuilder, ActionRowBuilder, Colors } from 'discord.js';
import { CommandOptions, CommandTags, Command, CommandOptionSolver } from '../commons';
import { ImgurClient, ImgurImagePayload } from '@/utils/imgur';
import ImgurUser from '@/models/imgurUsers';
import { Translator } from '@/i18n';

import Logger from '@/utils/logs';
const { error } = Logger('WARN', '/imgur');

const options = new CommandOptions()
	.addParam('enlaces', 'TEXT', 'para indicar enlaces de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addParam('imagens', 'IMAGE', 'para indicar archivos de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addFlag('r', [ 'registrar', 'register' ], 'para registrar una ID de cliente y evitar el límite global');

const tags = new CommandTags().add('COMMON');

const command = new Command('imgur', tags)
	.setAliases(
		'subir',
		'upload',
	)
	.setBriefDescription('Permite subir imágenes con Imgur')
	.setLongDescription(
		'Permite subir imágenes por medio de la plataforma de Imgur, limitado a un máximo diario global.',
		'Para evitar el máximo de subida global, puedes `--registrar` tu propia ID de cliente (explicado al usar la bandera de comando)',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		if(args.hasFlag('registrar')) {
			const embeds = [ new EmbedBuilder()
				.setColor('#1bb76e')
				.setTitle(translator.getText('imgurRegisterTitle'))
				.setURL('https://api.imgur.com/oauth2/addclient')
				.setDescription(translator.getText('imgurRegisterDesc'))
				.addFields(
					{
						name: 'Authorization Type',
						value: translator.getText('imgurRegisterAuthTypeValue'),
						inline: true,
					},
					{
						name: 'Authorization Callback URL',
						value: '`https://imgur.com/`',
						inline: true,
					},
					{
						name: translator.getText('imgurRegisterFillFormName'),
						value: translator.getText('imgurRegisterFillFormValue'),
						inline: true,
					},
					{
						name: translator.getText('imgurRegisterLastlyName'),
						value: translator.getText('imgurRegisterLastlyValue'),
					},
				),
			];

			const components = [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(`imgur_onButtonRegisterRequest`)
						.setLabel(translator.getText('buttonRegister'))
						.setEmoji('1355488586883137697')
						.setStyle(ButtonStyle.Primary),
				),
			];

			return request.reply({
				embeds,
				components,
				ephemeral: true,
			});
		}

		await request.deferReply();

		const imgurUser = (await ImgurUser.findOne({ userId: request.userId })) || new ImgurUser({ userId: request.userId });
		const clientId = imgurUser.clientId ?? process.env.IMGUR_CLIENT_ID;
		const client = new ImgurClient(clientId);

		const directUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(u => u);
		const attachments = CommandOptionSolver.asAttachments(args.parsePolyParamSync('imagens')).filter(a => a);
		const attachmentUrls = attachments.map(attachment => attachment.url);

		const uploads: ImgurImagePayload[] = [
			...directUrls.map(url => ({ type: 'url' as const, image: url })),
			...attachmentUrls.map(url => ({ type: 'url' as const, image: url })),
		];

		if(!uploads.length)
			return request.editReply({
				content: translator.getText('imgurInvalidImage'),
			});

		let count = 1;
		const successes = [];
		const failures = [];
		for(const upload of uploads) {
			const result = await client.upload(upload);

			if(result.success === true) {
				successes.push(new EmbedBuilder()
					.setTitle(translator.getText('imgurUploadSuccessTitle'))
					.setColor(Colors.Green)
					.setURL(result.data.link)
					.setDescription(result.data.link)
					.setImage(result.data.link));
			} else {
				error(result.error);
				failures.push(new EmbedBuilder()
					.setTitle(translator.getText('imgurUploadErrorTitle', count))
					.setDescription(translator.getText('imgurUploadErrorDesc'))
					.setColor(Colors.Red)
					.addFields({
						name: `Error ${result.status}`,
						value: `\`\`\`\n${result.statusText}\n\`\`\``,
					}));
			}

			count++;
		}

		return request.editReply({ embeds: [ ...successes, ...failures ] });
	}).setButtonResponse(async function onButtonRegisterRequest(interaction) {
		const translator = await Translator.from(interaction.user.id);

		const modal = makeRegisterModal(translator);
		return interaction.showModal(modal);
	}).setModalResponse(async function onRegisterRequest(interaction) {
		const translator = await Translator.from(interaction.user.id);

		const imgurUser = (await ImgurUser.findOne({ userId: interaction.user.id })) || new ImgurUser({ userId: interaction.user.id });
		const clientId = interaction.fields.getTextInputValue('clientId');
		imgurUser.clientId = clientId;
		await imgurUser.save();
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor('#1bb76e')
					.setTitle(translator.getText('imgurRegisterSuccess')),
			],
			ephemeral: true,
		});
	});

function makeRegisterModal(translator: Translator) {
	const clientIdLabel = new LabelBuilder()
		.setLabel(translator.getText('imgurRegisterModalClientIdLabel'))
		.setTextInputComponent(
			new TextInputBuilder()
				.setCustomId('clientId')
				.setRequired(true)
				.setMinLength(8)
				.setMaxLength(32)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('XXXXXXXXXXXXXXX')
		);

	const modal = new ModalBuilder()
		.setCustomId('imgur_onRegisterRequest')
		.setTitle(translator.getText('imgurRegisterModalTitle'))
		.addLabelComponents(clientIdLabel);

	return modal;
}

export default command;
