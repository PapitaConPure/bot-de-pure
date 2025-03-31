const { EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { default: axios } = require('axios');
const { Catbox } = require('node-catbox');
const { pipeline } = require('stream/promises');
const fs = require('fs')

const client = new Catbox();

const options = new CommandOptions()
	.addParam('enlaces', 'TEXT', 'para indicar enlaces de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addParam('imagens', 'IMAGE', 'para indicar archivos de imágenes a subir', { optional: true, poly: 'MULTIPLE', polymax: 5 })
	.addFlag('r', [ 'registrar' ], 'para registrar una ID de cliente y evitar el límite global');

const flags = new CommandTags().add('COMMON');

const command = new CommandManager('catbox', flags)
	.setBriefDescription('Permite subir imágenes con Catbox')
	.setLongDescription('Permite subir imágenes por medio de la plataforma de Catbox.')
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		await request.deferReply();
		
		const imageUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(u => u);
		const attachments = CommandOptionSolver.asAttachments(args.parsePolyParamSync('imagens')).filter(a => a);
		const imageStreams = await Promise.all(attachments
			.map(async attachment => /**@type {ReadableStream}*/((await axios.get(attachment.url, { responseType: 'stream' })).data))
			.slice(0, 5));

		const urlUploads = imageUrls.map(url => ({ data: url, type: /**@type {const}*/('url') }));
		const streamUploads = imageStreams.map(stream => ({ data: stream, type: /**@type {const}*/('stream') }));
		const uploads = [
			...urlUploads,
			...streamUploads,
		];

		if(!uploads.length)
			return request.editReply({ content: translator.getText('catboxInvalidImage'), ephemeral: true });

		let count = 1;

		/**@type {Array<Promise<string?>>}*/
		const filePaths = [];
		for(const upload of streamUploads) {
			const filePath = `./temp_${request.id}_${count++}.png`;
			
			const filePathResult = /**@type {Promise<string?>}*/(pipeline(upload.data, fs.createWriteStream(filePath))
			.then(() => filePath)
			.catch(() => null));

			filePaths.push(filePathResult);
		}

		const readyFilePaths = await Promise.all(filePaths);
		const filePathsPendingForDeletion = readyFilePaths.filter(p => p);

		const successes = [];
		const failures = [];
		let imageUrl;
		count = 1;
		for(const upload of uploads) {
			try {
				if(upload.type === 'url') {
					const url = upload.data;
					imageUrl = await client.uploadURL({ url });
				} else {
					const path = readyFilePaths.shift();
					if(!path)
						throw new FileStreamError('Unable to create a file write stream for the specified data.');
					imageUrl = await client.uploadFile({ path });
				}

				successes.push(new EmbedBuilder()
					.setTitle(translator.getText('imgurUploadSuccessTitle'))
					.setColor(Colors.Green)
					.setURL(imageUrl)
					.setDescription(imageUrl)
					.setImage(imageUrl));
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

		await Promise.allSettled(filePathsPendingForDeletion.map(p => fs.promises.unlink(p)));

		return request.editReply({ embeds: [ ...successes, ...failures ] });
	});

class FileStreamError extends Error {
	/**@param {string} message*/
	constructor(message) {
		super(message);
		this.name = 'FileStreamError';
	}
}

module.exports = command;
