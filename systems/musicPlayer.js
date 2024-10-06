const { Player, useMainPlayer } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, ModalSubmitInteraction, Colors } = require('discord.js'); //Integrar discord.js
const { compressId, decompressId, shortenText } = require('../func.js'); //Funciones globales
const { makeButtonRowBuilder, makeStringSelectMenuRowBuilder } = require('../tsCasts.js');
const { Translator } = require('../internationalization.js');
const { tryRecoverSavedTracksQueue, saveTracksQueue } = require('../localdata/models/playerQueue.js');

/**
 * @typedef {import('discord-player').Track['source']} ServiceKey
 * 
 * @typedef {Object}  BaseServiceInfo
 * @property {Number} color
 * @property {String} iconUrl
 * 
 * @typedef {Object} KnownServiceInfo
 * @property {String} name
 * @property {false} isArbitrary
 * 
 * @typedef {Object} ArbitraryServiceInfo
 * @property {null} name
 * @property {true} isArbitrary
 * 
 * @typedef {BaseServiceInfo & (KnownServiceInfo | ArbitraryServiceInfo)} ServiceInfo
 */

/**@type {{ [K in ServiceKey]: ServiceInfo }}*/
const SERVICES = {
	youtube:     { name: 'YouTube',     color: 0xff0000, iconUrl: 'https://i.imgur.com/0k9tFqd.png', isArbitrary: false },
	spotify:     { name: 'Spotify',     color: 0x1db954, iconUrl: 'https://i.imgur.com/qpCz3Ug.png', isArbitrary: false },
	soundcloud:  { name: 'SoundCloud',  color: 0xff7e19, iconUrl: 'https://i.imgur.com/UVx6eva.png', isArbitrary: false },
	apple_music: { name: 'Apple Music', color: 0xfc334a, iconUrl: 'https://i.imgur.com/Nw0aLwN.png', isArbitrary: false },
	arbitrary:   { name: null,          color: 0x9e3845, iconUrl: 'https://i.imgur.com/LC5Ic3R.png', isArbitrary: true  },
};

/**Cantidad máxima de pistas por página al mostrar la cola de reproducción*/
const QUEUE_PAGE_TRACKS_MAX = 5;

/**
 * Registra un reproductor y extractor de YouTube
 * @param {import('discord.js').Client} client
 */
async function prepareTracksPlayer(client) {
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
	
	player.events.on('playerFinish', (queue, _track) => {
		saveTracksQueue(queue.metadata, queue);
	});

	player.events.on('error', (err) => {
		console.log('Error general de reproductor');
		console.log({ err });
	});

	player.events.on('playerError', (queue, err) => {
		console.log('Error de reproductor');
		console.log({ queue });
		console.error(err);
	});

	player.on('error', (error) => {
		console.log(`Error emitted from the player: ${error.message}`);
	});
	player.events.on('connectionDestroyed', (queue) => {
		console.log(`[${queue.guild.name}] Connection destroyed`);
	});
}

/**
 * Muestra una página de la queue de la Guild actual
 * @param {import('../commands/Commons/typings.js').ComplexCommandRequest | ButtonInteraction<'cached'> | StringSelectMenuInteraction<'cached'> | ModalSubmitInteraction<'cached'>} request El request que desencadenó esta petición
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
		return (request.reply)({ content: translator.getText('voiceExpected'), ephemeral: true });

	if(isPlayerUnavailable(channel))
		return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
	
	const shortChannelName = shortenText(channel.name, 20);

	/**@param {import('discord.js').ColorResolvable} color*/
	const makeReplyEmbed = (color) => new EmbedBuilder()
		.setColor(color)
		.setTitle(translator.getText('queueTitle'))
		.setAuthor({
			name: request.member.displayName,
			iconURL: request.member.displayAvatarURL({ size: 128 }),
		});
	
	if(op !== 'PL') {
		await ((!op || op === 'CM')
			? request.deferReply()
			: /**@type {ButtonInteraction<'cached'>}*/(request).deferUpdate());
	}

	const player = useMainPlayer();
	const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));

	if(!queue?.currentTrack && !queue?.size) {
		const embed = makeReplyEmbed(Colors.Blurple)
			.setDescription(translator.getText('queueDescriptionEmptyQueue'))
			.setFooter({
				text: `${shortChannelName}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			});

		const replyObj = {
			embeds: [ embed ],
			components: [ getQueueActionRow(queue, page, request.user.id, translator) ],
		};
		return request.editReply(replyObj);
	}

	let offset = page * QUEUE_PAGE_TRACKS_MAX;
	while(queue.size && offset >= queue.size)
		offset = (op === 'DE') ? Math.max(0, offset - QUEUE_PAGE_TRACKS_MAX) : 0;
	
	const tracks = queue.tracks.toArray().slice(offset, offset + QUEUE_PAGE_TRACKS_MAX);
	const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
	
	const lastPage = queue.size ? (Math.ceil(queue.size / QUEUE_PAGE_TRACKS_MAX) - 1) : 0;
	const previousPage = page === 0 ? lastPage : page - 1;
	const nextPage = page === lastPage ? 0 : page + 1;
	const footerText = `${shortChannelName} • ${queueInfo} • ${page + 1}/${lastPage + 1}`;

	let queueEmbed;
	
	if(queue.currentTrack) {
		const currentTrack = queue.currentTrack;
		const isPaused = queue.node.isPaused();
		const progressBar = isPaused ? '' : `\n${queue.node.createProgressBar({
			length: 16,
			queue: false,
			timecodes: false,
			leftChar:  '▰',
			indicator: '',
			rightChar: '▱',
		})}`;
		
		const service = SERVICES[currentTrack.source];
		queueEmbed = makeReplyEmbed(service.color)
			.setThumbnail(currentTrack.thumbnail)
			.addFields({
				name: `${isPaused ? '0.' : translator.getText('queueNowPlayingName')}  ⏱️ ${currentTrack.duration}${ currentTrack.requestedBy ? `  👤 ${currentTrack.requestedBy.username}` : '' }`,
				value: `[${currentTrack.title}](${currentTrack.url})${progressBar}`,
			})
			.setFooter({
				text: footerText,
				iconURL: service.iconUrl,
			});
	} else {
		queueEmbed = makeReplyEmbed(Colors.Blurple)
			.setFooter({
				text: footerText,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			});
	}
	
	queueEmbed
		.addFields(...tracks.map((t, i) => ({
			name: `${i + offset + 1}.  ⏱️ ${t.duration}${ t.requestedBy ? `  👤 ${t.requestedBy.username}` : '' }`,
			value: `[${t.title || '<<???>>'}](${t.url})`,
		})))
		.setTimestamp(Date.now());
	
	const compressedUserId = compressId(request.user.id);

	const components = [];
	const actionRow = getQueueActionRow(queue, page, request.user.id, translator);

	if(queue.size) {
		if(queue.size > QUEUE_PAGE_TRACKS_MAX) {
			const navigationRow = makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`cola_showPage_FP_${compressedUserId}_0`)
					.setEmoji('934430008586403900')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_PV_${compressedUserId}_${previousPage}`)
					.setEmoji('934430008343158844')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_NX_${compressedUserId}_${nextPage}`)
					.setEmoji('934430008250871818')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_LP_${compressedUserId}_${lastPage}`)
					.setEmoji('934430008619962428')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_CU_${compressedUserId}_${page}`)
					.setEmoji('1292310983527632967')
					.setStyle(ButtonStyle.Primary),
			);

			components.push(navigationRow);
		}

		const menuRow = makeStringSelectMenuRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(`cola_dequeue_${compressedUserId}_${page}`)
				.setPlaceholder(translator.getText('queueMenuDequeuePlaceholder'))
				.setMaxValues(1)
				.addOptions(tracks.map((t, i) => ({
					label: shortenText(t.title, 48),
					value: `${page}:${i}:${t.id}`,
				})))
		);
		
		components.push(actionRow);
		components.push(menuRow);
	} else
		components.push(actionRow);

	const replyObj = {
		embeds: [ queueEmbed ],
		components,
	};
	return request.editReply(replyObj);
}

/**
 * 
 * @param {import('discord-player').GuildQueue} queue 
 * @param {Number} page
 * @param {String} userId 
 * @param {Translator} translator 
 */
function getQueueActionRow(queue, page, userId, translator) {
	const compressedUserId = compressId(userId);

	const actionRow = makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`cola_add_${compressedUserId}_${page}`)
			.setEmoji('1291900911643263008')
			.setStyle(ButtonStyle.Success),
	);

	if(!queue)
		return actionRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`cola_showPage_CU_${compressedUserId}_${page}`)
				.setEmoji('1292310983527632967')
				.setStyle(ButtonStyle.Primary),
		);

	if(queue.currentTrack) {
		const pauseOrResumeButton = queue.node.isPaused()
			? new ButtonBuilder()
				.setCustomId(`cola_resume_${compressedUserId}_${page}`)
				.setEmoji('934430008250871818')
				.setStyle(ButtonStyle.Primary)
			: new ButtonBuilder()
				.setCustomId(`cola_pause_${compressedUserId}_${page}`)
				.setEmoji('1291898882204110879')
				.setStyle(ButtonStyle.Primary);
		
		actionRow.addComponents(
			pauseOrResumeButton,
			new ButtonBuilder()
				.setCustomId(`cola_skip_${compressedUserId}_${page}`)
				.setEmoji('934430008619962428')
				.setLabel(translator.getText('queueButtonSkip'))
				.setStyle(ButtonStyle.Primary),
		);
	}

	const refreshButton = new ButtonBuilder()
		.setCustomId(`cola_showPage_CU_${compressedUserId}_${page}`)
		.setEmoji('1292310983527632967')
		.setStyle(ButtonStyle.Primary);
	if(queue.size) {
		actionRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`cola_clearQueue_${compressedUserId}`)
				.setEmoji('921751138997514290')
				.setLabel(translator.getText('queueButtonClearQueue'))
				.setStyle(ButtonStyle.Danger),
		);

		if(queue.size <= QUEUE_PAGE_TRACKS_MAX)
			actionRow.addComponents(refreshButton);
	} else {
		actionRow.addComponents(refreshButton);
	}

	return actionRow;
}

/**
 * 
 * @param {Number} page 
 * @param {Number} num 
 */
function getPageAndNumberTrackIndex(page, num) {
	const pageOffset = page * QUEUE_PAGE_TRACKS_MAX;
	return pageOffset + num;
}

/**
 * 
 * @param {import('discord.js').BaseGuildVoiceChannel} targetChannel 
 */
function isPlayerUnavailable(targetChannel) {
	const playerChannel = targetChannel.guild?.members?.me?.voice?.channel;
	if(!playerChannel) return false;
	return playerChannel.id !== targetChannel.id;
}

module.exports = {
	SERVICES,
	prepareTracksPlayer,
	showQueuePage,
	getPageAndNumberTrackIndex,
	isPlayerUnavailable,
};
