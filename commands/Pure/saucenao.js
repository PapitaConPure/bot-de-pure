const { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js'); //Integrar discord.js
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands');
const { pourSauce, testSauceNAOToken } = require('../../systems/others/saucenao');
const { Translator } = require('../../i18n/internationalization');
const { encryptString } = require('../../utils/security');
const { makeButtonRowBuilder, makeTextInputRowBuilder } = require('../../utils/tsCasts');
const SauceNAOUser = require('../../models/saucenaoUsers');

const Logger = require('../../utils/logs');
const { debug } = Logger('ERROR', 'p!saucenao');

const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', 'para dar un mensaje por respuesta o por ID/enlace (Slash)', { optional: true })
	.addParam('enlaces', 'TEXT', 'para indicar enlaces de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addParam('imagens', 'IMAGE', 'para indicar archivos de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addFlag('r', [ 'registrar', 'register' ], 'para registrar una ID de usuario de SauceNAO');

const flags = new CommandTags().add('COMMON');

const command = new CommandManager('saucenao', flags)
	.setAliases(
		'salsa', 'fuente',
		'sauce', 'source',
	)
	.setBriefDescription('Permite buscar fuentes de imágenes con SauceNAO')
	.setLongDescription('Permite realizar búsqueda reversa de imágenes por medio de la plataforma de SauceNAO.')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		debug('Verificando flag --registrar');
		if(args.parseFlag('registrar'))
			return makeRegisterRequestResponse(request, translator);

		const sauceNAOUser = (await SauceNAOUser.findOne({ userId: request.userId }));
		if(!sauceNAOUser) {
			debug('Usuario no tiene una cuenta de sauceNAO válida. Abortando...')
			const embed = new EmbedBuilder()
				.setColor(0x151515)
				.setDescription(translator.getText('saucenaoUnregisteredNotice'));

			return request.reply({
				embeds: [embed],
				ephemeral: true,
			});
		}
		
		const message = (request.isInteraction && await args.getMessage('mensaje'))
			|| (request.isMessage && request.channel.messages.cache.get(request.inferAsMessage().reference?.messageId));
		const messageAttachments = message?.attachments
			? message.attachments.values()
			: /**@type {Array<import('discord.js').Attachment>}*/([]);
		
		const imageUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(u => u);
		const commandAttachments = CommandOptionSolver.asAttachments(args.parsePolyParamSync('imagens')).filter(a => a);
		
		const attachments = [
			...messageAttachments,
			...commandAttachments,
		];
		
		const attachmentUrls = attachments.map(att => att.url);
		const otherMessageUrls = message?.embeds
			? (message.embeds
				?.flatMap(e => [ e.image?.url, e.thumbnail?.url ])
				.filter(u => u))
			: [];

		const queries = [
			...imageUrls,
			...attachmentUrls,
			...otherMessageUrls,
		].slice(0, 5);

		debug('queries = ', queries);

		if(!queries.length) {
			if(message?.stickers.size)
				queries.push(...message.stickers.map(s => s.url));
		}

		if(!queries.length)
			return request.reply({
				content: translator.getText('saucenaoInvalidImage'),
				ephemeral: true,
			});

		await request.deferReply();

		const successes = [];
		const failures = [];
		
		await pourSauce(sauceNAOUser.clientId, queries, request, { successes, failures });

		if(!successes.length && !failures.length)
			return request.editReply({ content: translator.getText('saucenaoInvalidImage') });

		return request.editReply({ embeds: [ ...successes, ...failures ] });
	}).setButtonResponse(async function onButtonRegisterRequest(interaction) {
		const translator = await Translator.from(interaction.user.id);

		const modal = makeRegisterModal(translator);
		return interaction.showModal(modal);
	}).setModalResponse(async function onRegisterRequest(interaction) {
		const translator = await Translator.from(interaction.user.id);
		
		const clientId = interaction.fields.getTextInputValue('clientId').trim();

		if(!testSauceNAOToken(clientId)) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(translator.getText('saucenaoInvalidToken')),
				],
			});
		}

		const sauceNAOUser = (await SauceNAOUser.findOne({ userId: interaction.user.id })) || new SauceNAOUser({ userId: interaction.user.id });
		sauceNAOUser.clientId = encryptString(clientId);
		await sauceNAOUser.save();
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(0x151515)
					.setTitle(translator.getText('saucenaoRegisterSuccess')),
			],
			ephemeral: true,
		});
	});

/**
 * @param {import('../Commons/typings').ComplexCommandRequest} request
 * @param {Translator} translator
 */
function makeRegisterRequestResponse(request, translator) {
	debug('Se enviará el mensaje de registro');
	const embeds = [new EmbedBuilder()
		.setColor(0x151515)
		.setTitle(translator.getText('saucenaoRegisterTitle'))
		.setFooter({
			text: translator.getText('saucenaoRegisterFooter'),
		})
		.addFields(
			{
				name: translator.getText('saucenaoRegisterAccountName'),
				value: translator.getText('saucenaoRegisterAccountValue'),
			},
			{
				name: translator.getText('saucenaoRegisterAfterName'),
				value: translator.getText('saucenaoRegisterAfterValue'),
			},
		),
	];

	const components = [makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`saucenao_onButtonRegisterRequest`)
			.setLabel(translator.getText('buttonRegister'))
			.setEmoji('1355488586883137697')
			.setStyle(ButtonStyle.Primary),
	)];

	return request.reply({
		embeds,
		components,
		ephemeral: true,
	});
}

/**@param {Translator} translator*/
function makeRegisterModal(translator) {
	const clientIdRow = makeTextInputRowBuilder().addComponents(
		new TextInputBuilder()
			.setCustomId('clientId')
			.setLabel(translator.getText('saucenaoRegisterModalApiKeyLabel'))
			.setRequired(true)
			.setMinLength(16)
			.setMaxLength(56)
			.setStyle(TextInputStyle.Short)
			.setPlaceholder('XXXXXXXXXXXXXXX'),
	);

	const modal = new ModalBuilder()
		.setCustomId('saucenao_onRegisterRequest')
		.setTitle(translator.getText('saucenaoRegisterModalTitle'))
		.addComponents(clientIdRow);

	return modal;
}

module.exports = command;
