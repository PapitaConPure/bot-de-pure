const { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, ModalBuilder, Attachment } = require('discord.js'); //Integrar discord.js
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization');
const SauceNAOUser = require('../../localdata/models/saucenaoUsers');
const ___ = require('sagiri');
const sagiri = ___.default ? ___.default : /**@type {null}*/(___);
const globalConfigs = require('../../localdata/config.json');
const { encryptString, decryptString } = require('../../security');
const { makeButtonRowBuilder, makeTextInputRowBuilder } = require('../../tsCasts.js');
const { Booru } = require('../../systems/booru/boorufetch.js');

const options = new CommandOptions()
	.addParam('mensaje', 'MESSAGE', 'para dar un mensaje por respuesta o por ID/enlace (Slash)', { optional: true })
	.addParam('enlaces', 'TEXT', 'para indicar enlaces de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addParam('imagens', 'IMAGE', 'para indicar archivos de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addFlag('r', [ 'registrar', 'register' ], 'para registrar una ID de usuario de SauceNAO');

const flags = new CommandTags().add('COMMON', 'MAINTENANCE');

const command = new CommandManager('saucenao', flags)
	.setAliases(
		'salsa', 'fuente',
		'sauce', 'source',
	)
	.setBriefDescription('Permite buscar fuentes de imágenes con SauceNAO')
	.setLongDescription('Permite realizar búsqueda reversa de imágenes por medio de la plataforma de SauceNAO.')
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		if(args.parseFlag('registrar')) {
			const embeds = [new EmbedBuilder()
				.setColor(0x151515)
				.setTitle(translator.getText('saucenaoRegisterTitle'))
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

		await request.deferReply();

		const sauceNAOUser = (await SauceNAOUser.findOne({ userId: request.userId }));
		if(!sauceNAOUser)
			return request.reply(translator.getText('saucenaoUnregisteredNotice'));

		const clientId = decryptString(sauceNAOUser.clientId);
		const findSauce = sagiri(clientId, {
			results: 3,
			mask: [25], //Gelbooru
		});
		
		const message = (request.isInteraction && CommandOptionSolver.asMessage(await args.getMessage('mensaje')))
			|| (request.isMessage && request.channel.messages.cache.get(request.inferAsMessage().reference?.messageId));
		const messageAttachments = message?.attachments.values() || /**@type {Array<Attachment>}*/([]);
		
		const imageUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(u => u);
		const commandAttachments = CommandOptionSolver.asAttachments(args.parsePolyParamSync('imagens')).filter(a => a);
		
		const attachments = [
			...messageAttachments,
			...commandAttachments,
		];
		
		const attachmentUrls = attachments.map(att => att.url);
		const otherMessageUrls = message?.embeds
			?.flatMap(e => [ e.image?.url, e.thumbnail?.url ])
			.filter(u => u)
			|| [];

		const queries = [
			...imageUrls,
			...attachmentUrls,
			...otherMessageUrls,
		].slice(0, 5);

		if(!queries.length)
			return request.editReply({ content: translator.getText('saucenaoInvalidImage'), ephemeral: true });

		const booru = new Booru(globalConfigs.booruCredentials);
		const successes = [];
		const failures = [];
		let count = 1;
		for(const query of queries) {
			try {
				const results = (await findSauce(query))
					.filter(result => result.similarity > 50);

				if(results.length === 0) {
					successes.push(new EmbedBuilder()
						.setColor(Colors.Greyple)
						.setTitle(translator.getText('saucenaoSearchNoResult', count))
						.setThumbnail(query));
					continue;
				}

				await Promise.all(results.map(async result => {
					try {
						const post = await booru.fetchPostByUrl(result.url);
						const sources = post.findUrlSources();
						const sourcesText = `${result.url}\n${sources.join('\n')}`;
	
						successes.push(new EmbedBuilder()
							.setColor(Colors.Green)
							.setAuthor({
								name: result.authorName,
								url: result.authorUrl,
							})
							.setTitle(translator.getText('saucenaoSearchSuccess', count))
							.setDescription(sourcesText)
							.setURL(result.url)
							.setThumbnail(result.thumbnail)
							.setFooter({ text: `${result.similarity}%` }));
					} catch(err) {
						console.error(err);
						successes.push(new EmbedBuilder()
							.setColor(Colors.Orange)
							.setAuthor({
								name: result.authorName,
								url: result.authorUrl,
							})
							.setTitle(translator.getText('saucenaoSearchErrorTitle', count))
							.setDescription(result.url)
							.setURL(result.url)
							.setThumbnail(result.thumbnail)
							.setFooter({ text: `${result.similarity}%` }));
					}
				}));
			} catch(err) {
				failures.push(new EmbedBuilder()
					.setTitle(translator.getText('imgurUploadErrorTitle', count))
					.setColor(Colors.Red)
					.addFields({
						name: err.name || 'Error',
						value: `\`\`\`\n${err.message || err}\n\`\`\``,
					}));
			}

			count++;
		}

		if(!successes.length && !failures.length)
			return request.editReply({ content: translator.getText('saucenaoInvalidImage') });	

		return request.editReply({ embeds: [ ...successes, ...failures ] });
	}).setButtonResponse(async function onButtonRegisterRequest(interaction) {
		const translator = await Translator.from(interaction.user.id);

		const modal = makeRegisterModal(translator);
		return interaction.showModal(modal);
	}).setModalResponse(async function onRegisterRequest(interaction) {
		const translator = await Translator.from(interaction.user.id);

		const sauceNAOUser = (await SauceNAOUser.findOne({ userId: interaction.user.id })) || new SauceNAOUser({ userId: interaction.user.id });
		const clientId = interaction.fields.getTextInputValue('clientId');
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
