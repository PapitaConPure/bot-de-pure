const { ModalBuilder, TextInputBuilder, TextInputStyle, Colors, ButtonBuilder, ButtonStyle } = require('discord.js'); //Integrar discord.js
const { decompressId, sleep } = require('../../func'); //Funciones globales
const { CommandTags, Command } = require('../Commons/');
const { useMainPlayer, QueueRepeatMode } = require('discord-player');
const { showQueuePage, getPageAndNumberTrackIndex, isPlayerUnavailable, SERVICES, makePuréMusicEmbed } = require('../../systems/others/musicPlayer');
const { Translator } = require('../../i18n');
const { tryRecoverSavedTracksQueue, saveTracksQueue } = require('../../models/playerQueue.js');
const { makeTextInputRowBuilder } = require('../../utils/tsCasts.js');
const { p_pure } = require('../../utils/prefixes');

const tags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new Command('cola', tags)
	.setAliases(
		'queue',
		'q',
	)
	.setBriefDescription('Muestra la cola de reproducción')
	.setLongDescription(
		'Muestra un listado de las pistas que se encuentran en la cola de reproducción del canal de voz.',
		'Además, provee controles para agregar o quitar pistas de la cola, junto con opciones para pausar, reanudar o alterar la cola.',
		'También permite consultar la pista que se está reproduciendo actualmente (si aplica).',
	)
	.addWikiRow(
		new ButtonBuilder()
			.setCustomId('ayuda_showCommand_reproducir')
			.setEmoji('1369424059871395950')
			.setLabel('¿Cómo puedo reproducir pistas?')
			.setStyle(ButtonStyle.Secondary),
	)
	.setExecution(async request => {
		return showQueuePage(request, 'CM');
	})
	.setButtonResponse(async function showPage(interaction, op, authorId, page) {
		return showQueuePage(interaction, op, authorId, +page);
	})
	.setButtonResponse(async function add(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const queryRow = makeTextInputRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('query')
				.setLabel(translator.getText('queueModalAddQueryLabel'))
				.setLabel(translator.getText('queueModalAddQueryPlaceholder'))
				.setRequired(true)
				.setMinLength(2)
				.setMaxLength(256)
				.setStyle(TextInputStyle.Short),
		);

		const modal = new ModalBuilder()
			.setCustomId(`cola_addQuery_${authorId}_${page}`)
			.setTitle('Añadir Pista')
			.addComponents(queryRow);

		return interaction.showModal(modal);
	})
	.setModalResponse(async function addQuery(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
		
		const query = interaction.fields.getTextInputValue('query');
		await interaction.deferUpdate();
		
		try {
			await tryRecoverSavedTracksQueue(interaction, false);

			const player = useMainPlayer();
			const { track, queue } = await player.play(channel, query, {
				nodeOptions: { metadata: interaction },
			});

			const service = SERVICES[track.source];
			const trackSource = service.name ?? translator.getText('playValueTrackSourceArbitrary');
			const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
			const trackEmbed = makePuréMusicEmbed(interaction, service.color, service.iconUrl, [ queueInfo ])
				.setTitle(queue.size ? translator.getText('playTitleQueueAdded') : translator.getText('playTitleQueueNew'))
				.setDescription(`[${track.title}](${track.url})`)
				.setThumbnail(track.thumbnail)
				.addFields(
					{
						name: translator.getText('duration'),
						value: track.duration,
						inline: true,
					},
					{
						name: translator.getText('source'),
						value: trackSource,
						inline: true,
					},
				)
				.setTimestamp(Date.now());

			await Promise.all([
				saveTracksQueue(interaction, queue),
				showQueuePage(interaction, 'PL', authorId, +page),
			]);

			return interaction.message.reply({ embeds: [ trackEmbed ] });
		} catch (e) {
			console.error(e);

			const errorEmbed = makePuréMusicEmbed(interaction, 0x990000, null)
				.setTitle(translator.getText('somethingWentWrong'))
				.addFields({
					name: 'Error',
					value: `\`\`\`\n${e?.message ?? e?.name ?? e ?? 'Error desconocido'}\n\`\`\``,
				});
			return interaction.editReply({ embeds: [ errorEmbed ] });
		}
	})
	.setButtonResponse(async function pause(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
		
		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		if(!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(interaction, Colors.Blurple)
				.setTitle(translator.getText('pauseTitleNoTrack'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const currentTrackHyperlink = `[${currentTrack.title}](${currentTrack.url})`;
		
		if(queue.node.isPaused()) {
			await showQueuePage(interaction, 'PA', authorId, +page);

			const embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl)
				.setTitle(translator.getText('pauseTitleTrackAlreadyPaused'))
				.setDescription(currentTrackHyperlink)
				.setThumbnail(currentTrack.thumbnail);
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.pause();

		await showQueuePage(interaction, 'PA', authorId, +page);

		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
		const embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl, [ queueInfo ])
			.setTitle(translator.getText('pauseTitlePaused'))
			.setDescription(currentTrackHyperlink)
			.setThumbnail(currentTrack.thumbnail)
			.setTimestamp(Date.now());
		return interaction.message.reply({ embeds: [ embed ] });
	})
	.setButtonResponse(async function resume(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		if(!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('resumirTitleNoTrack'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const currentTrackHyperlink = `[${currentTrack.title}](${currentTrack.url})`;
		
		if(!queue.node.isPaused() && queue.node.isPlaying()) {
			await showQueuePage(interaction, 'PA', authorId, +page);
			
			const embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl)
				.setTitle(translator.getText('resumirTitleTrackAlreadyResumed'))
				.setDescription(currentTrackHyperlink)
				.setThumbnail(currentTrack.thumbnail);
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.resume();

		await showQueuePage(interaction, 'PA', authorId, +page);

		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
		const embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl, [ queueInfo ])
			.setTitle(translator.getText('resumirTitleResumed'))
			.setDescription(currentTrackHyperlink)
			.setThumbnail(currentTrack.thumbnail)
			.setTimestamp(Date.now());
		return interaction.message.reply({ embeds: [ embed ] });
	})
	.setButtonResponse(async function skip(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId) ?? (await tryRecoverSavedTracksQueue(interaction));
		if(!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('queueSkipTitleNoTrack'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const {
			title: skippedTitle,
			url: skippedUrl,
			thumbnail: skippedThumbnail
		} = queue.currentTrack;

		if(!queue.size)
			queue.node.stop();
		else
			queue.node.skip();

		const service = SERVICES[queue.currentTrack.source];
		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
		const embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl, [ queueInfo ])
			.setTitle(translator.getText('queueSkipTitleSkipped'))
			.setDescription(`[${skippedTitle}](${skippedUrl})`)
			.setThumbnail(skippedThumbnail)
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);

		await sleep(1250);
		return showQueuePage(interaction, 'SK', authorId, +page);
	})
	.setButtonResponse(async function autoplay(interaction, authorId, page) {
		const userId = interaction.user.id;
		const translator = await Translator.from(userId);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId) ?? (await tryRecoverSavedTracksQueue(interaction));
		if(!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('queueSkipTitleNoTrack'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.setRepeatMode(
			(queue.repeatMode === QueueRepeatMode.AUTOPLAY)
				? QueueRepeatMode.OFF
				: QueueRepeatMode.AUTOPLAY);

		return showQueuePage(interaction, 'AP', authorId, +page);
	})
	.setButtonResponse(async function repeat(interaction, authorId, page) {
		const userId = interaction.user.id;
		const translator = await Translator.from(userId);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId) ?? (await tryRecoverSavedTracksQueue(interaction));
		if(!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('queueSkipTitleNoTrack'));
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if(queue.repeatMode === QueueRepeatMode.AUTOPLAY) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('queueLoopTitleAutoplayEnabled'))
				.setDescription(translator.getText('queueLoopDescAutoplayEnabled', p_pure(interaction.guildId)));
			return interaction.reply({ embeds: [embed], ephemeral: true, });
		}

		/**@type {Map<QueueRepeatMode, QueueRepeatMode>}*/
		const repeatModeWheel = new Map();
		repeatModeWheel
			.set(QueueRepeatMode.OFF, QueueRepeatMode.QUEUE)
			.set(QueueRepeatMode.QUEUE, QueueRepeatMode.TRACK)
			.set(QueueRepeatMode.TRACK, QueueRepeatMode.OFF);

		queue.setRepeatMode(repeatModeWheel.get(queue.repeatMode) ?? QueueRepeatMode.OFF);

		return showQueuePage(interaction, 'RP', authorId, +page);
	})
	.setSelectMenuResponse(async function shuffle(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(interaction.guild?.members?.me?.voice?.channel && interaction.guild.members.me.voice.channel.id !== channel.id)
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);
		
		queue.toggleShuffle();

		const embed = makePuréMusicEmbed(interaction)
			.setTitle(translator.getText('queueShuffleTitle', queue.isShuffling))
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);
		
		await sleep(1250);
		return showQueuePage(interaction, 'SF', authorId, +page);
	})
	.setButtonResponse(async function clearQueue(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(interaction.guild?.members?.me?.voice?.channel && interaction.guild.members.me.voice.channel.id !== channel.id)
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		if(!queue?.size) {
			const embed = makePuréMusicEmbed(interaction)
				.setDescription(translator.getText('queueDescriptionEmptyQueue'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.clear();

		const embed = makePuréMusicEmbed(interaction)
			.setTitle(translator.getText('queueClearTitleQueueCleared'))
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);
		return Promise.all([
			saveTracksQueue(interaction, queue),
			showQueuePage(interaction, 'CL', authorId),
		]);
	})
	.setSelectMenuResponse(async function dequeue(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(interaction.guild?.members?.me?.voice?.channel && interaction.guild.members.me.voice.channel.id !== channel.id)
			return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		const [ delPage, delNum, delId ] = interaction.values[0].split(':');
		const delIndex = getPageAndNumberTrackIndex(+delPage, +delNum);
		if(delIndex < 0 || delIndex >= (queue?.size ?? 0)) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('queueDequeueTitleTrackNotFound'))
				.setDescription(translator.getText('queueDequeueDescriptionTrackNotFound'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const track = queue.tracks.at(delIndex);
		if(!track || track.id !== delId) {
			const embed = makePuréMusicEmbed(interaction)
				.setTitle(translator.getText('queueDequeueTitleTrackNotFound'))
				.setDescription(translator.getText('queueDequeueDescriptionTrackNotFound'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const {
			title: removedTitle,
			url: removedUrl,
			thumbnail: removedThumbnail,
		} = track;
		const service = SERVICES[track.source];
		
		queue.removeTrack(track);

		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
		const embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl, [ queueInfo ])
			.setTitle(translator.getText('queueDequeueTitleDequeued'))
			.setDescription(`[${removedTitle}](${removedUrl})`)
			.setThumbnail(removedThumbnail)
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);
		return showQueuePage(interaction, 'DE', authorId, +page);
	});

module.exports = command;
