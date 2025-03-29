const { ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { radix10to64 } = require('../../func.js'); //Funciones globales
const { remoteStartup } = require('../../localdata/config.json'); //Configuraciones
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands.js');
const { makeTextInputRowBuilder, makeButtonRowBuilder } = require('../../tsCasts.js');
const { Translator } = require('../../internationalization.js');
const { ImgurClient } = require('imgur');
const { default: axios } = require('axios');
const ImgurUser = require('../../localdata/models/imgurUsers.js');
const envPath = remoteStartup ? '../../remoteenv.json' : '../../localenv.json';

const options = new CommandOptions()
	.addParam('enlaces', 'TEXT', 'para indicar enlaces de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addParam('imagens', 'IMAGE', 'para indicar archivos de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addFlag('r', [ 'registrar', 'register' ], 'para registrar una ID de cliente y evitar el límite global');

const flags = new CommandTags().add('COMMON');

const command = new CommandManager('imgur', flags)
	.setAliases(
		'subir',
		'upload',
	)
	.setBriefDescription('Permite subir imágenes con Imgur')
	.setLongDescription(
		'Permite subir imágenes por medio de la plataforma de Imgur, limitado a un máximo diario global.',
		'Para evitar el máximo de subida global, puedes \`--registrar\` tu propia ID de cliente (explicado al usar la bandera de comando)',
	)
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		if(args.parseFlag('registrar')) {
			const embeds = [new EmbedBuilder()
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

			const components = [makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`imgur_onButtonRegisterRequest`)
					.setLabel(translator.getText('buttonRegister'))
					.setEmoji('1087075525245272104')
					.setStyle(ButtonStyle.Primary),
			)];

			return request.reply({
				embeds,
				components,
				ephemeral: true,
			});
		}

		await request.deferReply();

		const imgurUser = (await ImgurUser.findOne({ userId: request.userId })) || new ImgurUser({ userId: request.userId });
		const clientId = imgurUser.clientId ?? require(envPath).imgurclientid;
		const client = new ImgurClient({ clientId });
		
		const imageUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(u => u);
		const attachments = CommandOptionSolver.asAttachments(args.parsePolyParamSync('imagens')).filter(a => a);
		const imageStreams = await Promise.all(attachments
			.map(async attachment => /**@type {ReadableStream}*/((await axios.get(attachment.url, { responseType: 'stream' })).data))
			.slice(0, 5));

		const uploads = [
			...imageUrls.map(url => ({ image: url, type: /**@type {const}*/('url') })),
			...imageStreams.map(stream => ({ image: stream, type: /**@type {const}*/('stream') })),
		];

		if(!uploads.length)
			return request.editReply({ content: translator.getText('imgurInvalidImage'), ephemeral: true });

		let count = 1;
		const successes = [];
		const failures = [];
		for(const upload of uploads) {
			const image = await client.upload(upload);
		
			if(image?.success)
				successes.push(new EmbedBuilder()
					.setTitle(translator.getText('imgurUploadSuccessTitle'))
					.setColor(Colors.Green)
					.setURL(image.data.link)
					.setDescription(image.data.link)
					.setImage(image.data.link));
			else
				failures.push(new EmbedBuilder()
					.setTitle(translator.getText('imgurUploadErrorTitle', count))
					.setDescription(translator.getText('imgurUploadErrorDesc'))
					.setColor(Colors.Red)
					.addFields({
						name: `Error ${image.status}`,
						value: `\`\`\`\n${image.data}\n\`\`\``,
					}));
			
			count++;
		}

		return request.editReply({ embeds: [ ...successes, ...failures ] });
	}).setButtonResponse(async function onButtonRegisterRequest(interaction) {
		const modal = makeRegisterModal();
		return interaction.showModal(modal);
	}).setModalResponse(async function onRegisterRequest(interaction) {
		const imgurUser = (await ImgurUser.findOne({ userId: interaction.user.id })) || new ImgurUser({ userId: interaction.user.id });
		const clientId = interaction.fields.getTextInputValue('clientId');
		imgurUser.clientId = clientId;
		await imgurUser.save();
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor('#1bb76e')
					.setTitle('Aplicación de Imgur Personal Registrada'),
			],
			ephemeral: true,
		});
	});

function makeRegisterModal() {
	const clientIdRow = makeTextInputRowBuilder().addComponents(
		new TextInputBuilder()
			.setCustomId('clientId')
			.setLabel('ID de Cliente de Imgur')
			.setRequired(true)
			.setMinLength(8)
			.setMaxLength(32)
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('XXXXXXXXXXXXXXX'),
	);

	const modal = new ModalBuilder()
		.setCustomId('imgur_onRegisterRequest')
		.setTitle('Registrar Aplicación de Imgur')
		.addComponents(clientIdRow);

	return modal;
}

module.exports = command;
