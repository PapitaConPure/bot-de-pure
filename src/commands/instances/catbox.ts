import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Colors, EmbedBuilder } from 'discord.js';
import { Catbox } from 'node-catbox';
import { Translator } from '@/i18n';
import { fetchExt } from '@/utils/fetchext';
import { Command, CommandOptionSolver, CommandOptions, CommandTags } from '../commons';

const client = new Catbox();

const options = new CommandOptions()
	.addParam('enlaces', 'TEXT', 'para indicar enlaces de imágenes a subir', {
		optional: true,
		poly: 'MULTIPLE',
		polymax: 5,
	})
	.addParam('imagens', 'IMAGE', 'para indicar archivos de imágenes a subir', {
		optional: true,
		poly: 'MULTIPLE',
		polymax: 5,
	});

const tags = new CommandTags().add('COMMON');

const command = new Command('catbox', tags)
	.setBriefDescription('Permite subir imágenes con Catbox')
	.setLongDescription('Permite subir imágenes por medio de la plataforma de Catbox.')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		await request.deferReply();

		const imageUrls = CommandOptionSolver.asStrings(args.parsePolyParamSync('enlaces')).filter(
			(u) => u,
		);
		const attachments = CommandOptionSolver.asAttachments(
			args.parsePolyParamSync('imagens'),
		).filter((a) => a != null);
		const imageStreams: (NodeJS.ReadableStream | undefined)[] = await Promise.all(
			attachments.slice(0, 5).map(async (attachment) => {
				const fetchResult = await fetchExt(attachment.url, { type: 'nodeStream' });
				return fetchResult.success ? fetchResult.data : undefined;
			}),
		);

		const urlUploads: (UrlPayload | InvalidPayload)[] = imageUrls.map((url) =>
			url != null ? { type: 'url', image: url } : { type: 'invalid' },
		);
		const streamUploads: (StreamPayload | InvalidPayload)[] = imageStreams.map((stream) =>
			stream != null
				? {
						type: 'stream',
						image: stream,
					}
				: {
						type: 'invalid',
					},
		);
		const uploads: Payload[] = [...urlUploads, ...streamUploads];

		if (!uploads.length)
			return request.editReply({
				content: translator.getText('catboxInvalidImage'),
			});

		let count = 1;

		const filePaths: Promise<string | null>[] = [];
		for (const upload of streamUploads) {
			const filePath = `./temp_${request.id}_${count++}.png`;

			if (upload.type === 'invalid') continue;

			const filePathResult: Promise<string | null> = pipeline(
				upload.image,
				fs.createWriteStream(filePath),
			)
				.then(() => filePath)
				.catch(() => null);

			filePaths.push(filePathResult);
		}

		const readyFilePaths: (string | null)[] = await Promise.all(filePaths);
		const filePathsPendingForDeletion: string[] = readyFilePaths.filter((p) => p != null);

		const successes: EmbedBuilder[] = [];
		const failures: EmbedBuilder[] = [];
		let imageUrl: string;
		count = 1;
		for (const upload of uploads) {
			try {
				if (upload.type === 'url') {
					const url = upload.image;
					imageUrl = await client.uploadURL({ url });
				} else {
					const path = readyFilePaths.shift();
					if (!path)
						throw new FileStreamError(
							'Unable to create a file write stream for the specified data.',
						);
					imageUrl = await client.uploadFile({ path });
				}

				successes.push(
					new EmbedBuilder()
						.setTitle(translator.getText('imgurUploadSuccessTitle'))
						.setColor(Colors.Green)
						.setURL(imageUrl)
						.setDescription(imageUrl)
						.setImage(imageUrl),
				);
			} catch (err) {
				failures.push(
					new EmbedBuilder()
						.setTitle(translator.getText('imgurUploadErrorTitle', count))
						.setColor(Colors.Red)
						.addFields({
							name: err.name || 'Error',
							value: `\`\`\`\n${err.message || err}\n\`\`\``,
						}),
				);
			}

			count++;
		}

		await Promise.allSettled(filePathsPendingForDeletion.map((p) => fs.promises.unlink(p)));

		return request.editReply({ embeds: [...successes, ...failures] });
	});

export default command;

type BasePayloadType = 'invalid' | 'url' | 'stream';
interface BasePayload<TType extends BasePayloadType, TImage> {
	type: TType;
	image: TImage;
}

type InvalidPayload = BasePayload<'invalid', undefined>;
type UrlPayload = BasePayload<'url', string>;
type StreamPayload = BasePayload<'stream', NodeJS.ReadableStream>;

type Payload = InvalidPayload | UrlPayload | StreamPayload;

class FileStreamError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FileStreamError';
	}
}
