const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Colors } = require('discord.js'); //Integrar discord.js
const { decompressId, shortenText, sleep, compressId } = require('../../func.js'); //Funciones globales
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { useMainPlayer, serialize, deserialize } = require('discord-player');
const { showQueuePage, getPageAndNumberTrackIndex, isPlayerUnavailable, SERVICES } = require('../../systems/musicPlayer.js');
const { Translator } = require('../../internationalization.js');
const { tryRecoverSavedTracksQueue, saveTracksQueue } = require('../../localdata/models/playerQueue.js');
const { makeTextInputRowBuilder } = require('../../tsCasts.js');

const tags = new CommandTags().add('COMMON');

const command = new CommandManager('cola', tags)
	.setAliases(
		'queue',
		'q',
	)
	.setBriefDescription('Muestra la cola de reproducción')
	.setLongDescription(
		'Muestra la cola de reproducción de pistas que se encuentran encoladas actualmente. Las pistas se encolan automáticamente con **p!reproducir**',
	)
	.setExperimentalExecution(async request => {
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

		/**@param {import('discord.js').ColorResolvable} color*/
		const makeReplyEmbed = (color) => new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: interaction.member.displayName,
				iconURL: interaction.member.displayAvatarURL({ size: 128 })
			})
			.setTimestamp(Date.now());
		
		try {
			await tryRecoverSavedTracksQueue(interaction, false);

			const player = useMainPlayer();
			const { track, queue } = await player.play(channel, query, {
				nodeOptions: { metadata: interaction },
			});

			const service = SERVICES[track.source];
			const trackSource = service.name ?? translator.getText('playValueTrackSourceArbitrary');
			const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
			const trackEmbed = makeReplyEmbed(service.color)
				.setTitle(queue.size ? translator.getText('playTitleQueueAdded') : translator.getText('playTitleQueueNew'))
				.setDescription(`[${track.title}](${track.url})`)
				.setThumbnail(track.thumbnail)
				.setFooter({
					text: `${channel.name} • ${queueInfo}`,
					iconURL: service.iconUrl,
				})
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
				);

			await Promise.all([
				saveTracksQueue(interaction, queue),
				showQueuePage(interaction, 'PL', authorId, +page),
			]);

			return interaction.message.reply({ embeds: [ trackEmbed ] });
		} catch (e) {
			console.error(e);

			const errorEmbed = makeReplyEmbed(0x990000)
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
		
		/**
		 * @param {import('discord.js').ColorResolvable} color
		 * @param {String} [iconUrl]
		 */
		const makeReplyEmbed = (color, iconUrl = null) => new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: interaction.member.displayName,
				iconURL: interaction.member.displayAvatarURL({ size: 128 }),
			})
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: iconUrl ?? 'https://i.imgur.com/irsTBIH.png',
			});

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		if(!queue?.currentTrack) {
			const embed = makeReplyEmbed(Colors.Blurple)
				.setTitle(translator.getText('pauseTitleNoTrack'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const embed = makeReplyEmbed(service.color, service.iconUrl)
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);
		
		if(queue.node.isPaused()) {
			embed.setTitle(translator.getText('pauseTitleTrackAlreadyPaused'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.pause();

		await showQueuePage(interaction, 'PA', authorId, +page);

		embed.setTitle(translator.getText('pauseTitlePaused'));
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
		
		/**
		 * @param {import('discord.js').ColorResolvable} color
		 * @param {String} [iconUrl]
		 */
		const makeReplyEmbed = (color, iconUrl = null) => new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: interaction.member.displayName,
				iconURL: interaction.member.displayAvatarURL({ size: 128 }),
			})
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: iconUrl ?? 'https://i.imgur.com/irsTBIH.png',
			})
			.setTimestamp(Date.now());

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		if(!queue?.currentTrack) {
			const embed = makeReplyEmbed(Colors.Blurple)
				.setTitle(translator.getText('resumirTitleNoTrack'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const embed = makeReplyEmbed(service.color, service.iconUrl)
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);
		
		if(!queue.node.isPaused() && queue.node.isPlaying()) {
			embed.setTitle(translator.getText('resumirTitleTrackAlreadyResumed'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.resume();

		await showQueuePage(interaction, 'PA', authorId, +page);

		embed.setTitle(translator.getText('resumirTitleResumed'));
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

		/**
		 * @param {import('discord.js').ColorResolvable} color
		 * @param {String} [iconUrl]
		 */
		const makeReplyEmbed = (color, iconUrl = null) => new EmbedBuilder()
			.setColor(color)
			.setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({ size: 128 }) })
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: iconUrl ?? 'https://i.imgur.com/irsTBIH.png',
			})
			.setTimestamp(Date.now());

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId) ?? (await tryRecoverSavedTracksQueue(interaction));
		if(!queue?.currentTrack) {
			const embed = makeReplyEmbed(Colors.Blurple)
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
		const embed = makeReplyEmbed(service.color, service.iconUrl)
			.setTitle(translator.getText('queueSkipTitleSkipped'))
			.setDescription(`[${skippedTitle}](${skippedUrl})`)
			.setThumbnail(skippedThumbnail);
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);

		await sleep(1250);
		return showQueuePage(interaction, 'SK', authorId, +page);
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

		const makeReplyEmbed = () => new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({ size: 128 }) })
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			})
			.setTimestamp(Date.now());

		if(!queue?.size) {
			const embed = makeReplyEmbed()
				.setDescription(translator.getText('queueDescriptionEmptyQueue'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.clear();

		const embed = makeReplyEmbed()
			.setTitle(translator.getText('queueClearTitleQueueCleared'));
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);
		return showQueuePage(interaction, 'CL', authorId);
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

		/**
		 * @param {import('discord.js').ColorResolvable} color
		 * @param {String} [iconUrl]
		 */
		const makeReplyEmbed = (color, iconUrl = null) => new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: interaction.member.displayName,
				iconURL: interaction.member.displayAvatarURL({ size: 128 }),
			})
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: iconUrl ?? 'https://i.imgur.com/irsTBIH.png',
			})
			.setTimestamp(Date.now());

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		const [ delPage, delNum, delId ] = interaction.values[0].split(':');
		const delIndex = getPageAndNumberTrackIndex(+delPage, +delNum);
		if(delIndex < 0 || delIndex >= (queue?.size ?? 0)) {
			const embed = makeReplyEmbed(Colors.Blurple)
				.setTitle(translator.getText('queueDequeueTitleTrackNotFound'))
				.setDescription(translator.getText('queueDequeueDescriptionTrackNotFound'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const track = queue.tracks.at(delIndex);
		if(!track || track.id !== delId) {
			const embed = makeReplyEmbed(Colors.Blurple)
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

		const embed = makeReplyEmbed(service.color, service.iconUrl)
			.setTitle(translator.getText('queueDequeueTitleDequeued'))
			.setDescription(`[${removedTitle}](${removedUrl})`)
			.setThumbnail(removedThumbnail)
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);
		return showQueuePage(interaction, 'DE', authorId, +page);
	});

module.exports = command;
