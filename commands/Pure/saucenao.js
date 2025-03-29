const { EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization');
const SauceNAOUser = require('../../localdata/models/saucenaoUsers');
const ___ = require('sagiri');
const sagiri = ___.default ? ___.default : /**@type {null}*/(___);
const { encryptString, decryptString } = require('../../security');

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
	.setBriefDescription('Permite subir imágenes con Catbox')
	.setLongDescription('Permite subir imágenes por medio de la plataforma de Catbox.')
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		await request.deferReply();

		const sauceNAOUser = (await SauceNAOUser.findOne({ userId: request.userId }));
		if(!sauceNAOUser)
			return request.reply(translator.getText('saucenaoUnregisteredNotice'));

		const clientId = decryptString(sauceNAOUser.clientId);
		const findSauce = sagiri(clientId, { results: 3 });
		
		const message = (request.isInteraction && CommandOptionSolver.asMessage(await args.getMessage('mensaje')))
			|| (request.isMessage && request.channel.messages.cache.get(request.inferAsMessage().reference?.messageId));
		const messageAttachments = message?.attachments.values() || [];

		const imageUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(u => u);
		const commandAttachments = CommandOptionSolver.asAttachments(args.parsePolyParamSync('imagens')).filter(a => a);

		const attachments = [
			...messageAttachments,
			...commandAttachments,
		];
		const attachmentUrls = attachments.map(att => att.url);

		const queries = [
			...imageUrls,
			...attachmentUrls,
		].slice(0, 5);

		if(!queries.length)
			return request.editReply({ content: translator.getText('saucenaoInvalidImage'), ephemeral: true });

		const successes = [];
		const failures = [];
		let count = 1;
		for(const query of attachmentUrls) {
			try {
				const results = (await findSauce(query))
					.filter(result => result.similarity > 50);

				if(results.length === 0)
					continue;
				
				for(const result of results) {
					successes.push(new EmbedBuilder()
						.setColor(Colors.Green)
						.setAuthor({
							name: result.authorName,
							url: result.authorUrl,
						})
						.setTitle(translator.getText('saucenaoSearchSuccess', count))
						.setDescription(result.url)
						.setURL(result.url)
						.setThumbnail(result.thumbnail)
						.setFooter({
							text: `~${result.similarity}% • ${result.site} • #${result.index}`,
						}));
				}
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

		return request.editReply({ embeds: [ ...successes, ...failures ] });
	});

module.exports = command;
