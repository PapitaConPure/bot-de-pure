const { Player, useMainPlayer } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction } = require('discord.js'); //Integrar discord.js
const { compressId, decompressId, shortenText } = require('../func.js'); //Funciones globales
const { makeButtonRowBuilder, makeStringSelectMenuRowBuilder } = require('../tsCasts.js');
const { Translator } = require('../internationalization.js');

/**Cantidad máxima de pistas por página al mostrar la cola de reproducción*/
const QUEUE_PAGE_TRACKS_MAX = 5;

/**
 * Registra un reproductor y extractor de YouTube
 * @param {import('discord.js').Client} client
 */
async function prepareYouTubePlayer(client) {
	const player = new Player(client, {
		ytdlOptions: {
			quality: 'highestaudio',
			highWaterMark: 1 << 25,
		},
		skipFFmpeg: true,
	});
	player.extractors.register(YoutubeiExtractor, {
		streamOptions: {
			highWaterMark: 1 << 25,
		},
	});
	await player.extractors.loadDefault();
	
	//player.events.on('playerStart', (queue, track) => {
	//	queue.metadata.channel.send(`Started playing **${track.title}**!`);
	//});
	player.events.on('error', (err) => {
		console.log('Error general de reproductor');
		console.log({ err });
	});

	player.events.on('playerError', (err) => {
		console.log('Error de reproductor');
		console.log({ err });
	});

	player.on('error', (error) => {
		console.log(`Error emitted from the player: ${error.message}`);
	});
	player.events.on('connectionDestroyed', (queue) => {
		console.log(`[${queue.guild.name}] Error emitted from the connection`);
	});
}

/**
 * Muestra una página de la queue de la Guild actual
 * @param {import('../commands/Commons/typings.js').ComplexCommandRequest | ButtonInteraction<'cached'> | StringSelectMenuInteraction<'cached'>} request El request que desencadenó esta petición
 * @param {String} [op] La operación particular que desencadena esta función
 * @param {String} [authorId] ID del autor para verificar permisos de botón
 * @param {Number} [page=0] Número de página, enumerado desde 0 y por defecto 0
 */
async function showQueuePage(request, op = undefined, authorId = undefined, page = 0) {
	const translator = await Translator.from(request.user.id);

	if(authorId && request.user.id !== decompressId(authorId))
		return request.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
	
	const channel = request.member.voice?.channel;
	if(!channel)
		return request.reply({ content: translator.getText('voiceExpected') });
	
	const shortChannelName = shortenText(channel.name, 20);

	const makeReplyEmbed = () => new EmbedBuilder()
		.setColor(0xff0000)
		.setTitle(translator.getText('queueTitle'))
		.setAuthor({ name: request.member.displayName, iconURL: request.member.displayAvatarURL({ size: 128 }) });

	const player = useMainPlayer();
	const queue = player.queues.get(request.guildId);

	if(!queue?.currentTrack) {
		const embed = makeReplyEmbed()
			.setDescription(translator.getText('queueDescriptionEmptyQueue'))
			.setFooter({
				text: `${shortChannelName}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			});

		const replyObj = { embeds: [ embed ] };
		return (!op || op === 'CM')
			? request.reply(replyObj)
			: /**@type {ButtonInteraction<'cached'>}*/(request).update(replyObj);
	}

	let offset = page * QUEUE_PAGE_TRACKS_MAX;
	while(queue.size && offset >= queue.size)
		offset = (op === 'DE') ? Math.max(0, offset - QUEUE_PAGE_TRACKS_MAX) : 0;
	
	const tracks = queue.tracks.toArray().slice(offset, offset + QUEUE_PAGE_TRACKS_MAX);
	const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size) : translator.getText('playFooterTextQueueSize', queue.size);
	
	const lastPage = queue.size ? (Math.ceil(queue.size / QUEUE_PAGE_TRACKS_MAX) - 1) : 0;
	const previousPage = page === 0 ? lastPage : page - 1;
	const nextPage = page === lastPage ? 0 : page + 1;
	
	const currentTrack = queue.currentTrack;
	const queueEmbed = makeReplyEmbed()
		.addFields(
			{
				name: `${translator.getText('queueNowPlayingName')}`,
				value: `[${currentTrack.title}](${currentTrack.url})`,
			},
			...tracks.map((t, i) => ({
				name: `${i + offset + 1}. - - -`,
				value: `[${t.title || '<<Video>>'}](${t.url})`,
			}),
		))
		.setFooter({
			text: `${shortChannelName} • ${queueInfo} • ${page + 1} / ${lastPage + 1}`,
			iconURL: 'https://i.imgur.com/irsTBIH.png',
		})
		.setThumbnail(currentTrack.thumbnail)
		.setTimestamp(Date.now());
	
	const compressedUserId = compressId(request.user.id);

	const components = [];
	const buttonsRow = makeButtonRowBuilder();
	components.push(buttonsRow);

	buttonsRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`cola_skip_${compressedUserId}_${page}`)
			.setEmoji('934430008619962428')
			.setLabel(translator.getText('queueButtonSkip'))
			.setStyle(ButtonStyle.Primary),
	);

	if(queue.size) {
		buttonsRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`cola_clearQueue_${compressedUserId}`)
				.setEmoji('921751138997514290')
				.setLabel(translator.getText('queueButtonClearQueue'))
				.setStyle(ButtonStyle.Danger),
		);
		
		if(queue.size > QUEUE_PAGE_TRACKS_MAX)
			buttonsRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`cola_showPage_PV_${compressedUserId}_${previousPage}`)
					.setEmoji('934430008343158844')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_NX_${compressedUserId}_${nextPage}`)
					.setEmoji('934430008250871818')
					.setStyle(ButtonStyle.Secondary),
			);

		const menuRow = makeStringSelectMenuRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(`cola_dequeue_${compressedUserId}_${page}`)
				.setPlaceholder(translator.getText('queueMenuDequeuePlaceholder'))
				.setMaxValues(1)
				.addOptions(tracks.map(t => ({
					label: shortenText(t.title, 48),
					value: t.id,
				})))
		);
		components.push(menuRow);
	}

	const replyObj = {
		embeds: [ queueEmbed ],
		components,
	};
	return (!op || op === 'CM')
		? request.reply(replyObj)
		: /**@type {ButtonInteraction<'cached'>}*/(request).update(replyObj);
}

module.exports = {
	prepareYouTubePlayer,
	showQueuePage,
};
