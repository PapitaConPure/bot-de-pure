const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { decompressId, shortenText, sleep } = require('../../func.js'); //Funciones globales
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');
const { showQueuePage, getPageAndNumberTrackIndex } = require('../../systems/musicPlayer.js');

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
	.setButtonResponse(async function skip(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected') });

		const makeReplyEmbed = () => new EmbedBuilder()
			.setColor(0xff0000)
			.setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({ size: 128 }) })
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			});

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);
		if(!queue?.currentTrack) {
			const embed = makeReplyEmbed()
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

		const embed = makeReplyEmbed()
			.setTitle(translator.getText('queueSkipTitleSkipped'))
			.setDescription(`[${skippedTitle}](${skippedUrl})`)
			.setThumbnail(skippedThumbnail)
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);

		await sleep(1200);
		return showQueuePage(interaction, 'SK', authorId, +page);
	})
	.setButtonResponse(async function clearQueue(interaction, authorId) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected') });

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		const makeReplyEmbed = () => new EmbedBuilder()
			.setColor(0xff0000)
			.setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.displayAvatarURL({ size: 128 }) })
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			});

		if(!queue?.size) {
			const embed = makeReplyEmbed()
				.setDescription(translator.getText('queueDescriptionEmptyQueue'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.clear();

		const embed = makeReplyEmbed()
			.setTitle(translator.getText('queueClearTitleQueueCleared'))
			.setTimestamp(Date.now());
		interaction.message.reply({ embeds: [ embed ] }).catch(console.error);
		return showQueuePage(interaction, 'CL', authorId);
	})
	.setSelectMenuResponse(async function dequeue(interaction, authorId, page) {
		const translator = await Translator.from(interaction.user.id);

		if(authorId && interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected') });

		const makeReplyEmbed = () => new EmbedBuilder()
			.setColor(0xff0000)
			.setAuthor({
				name: interaction.member.displayName,
				iconURL: interaction.member.displayAvatarURL({ size: 128 }),
			})
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			})
			.setTimestamp(Date.now());

		const player = useMainPlayer();
		const queue = player.queues.get(interaction.guildId);

		const [ delPage, delNum, delId ] = interaction.values[0].split(':');
		const delIndex = getPageAndNumberTrackIndex(+delPage, +delNum);
		if(delIndex < 0 || delIndex >= queue.size) {
			const embed = makeReplyEmbed()
				.setTitle(translator.getText('queueDequeueTitleTrackNotFound'))
				.setDescription(translator.getText('queueDequeueDescriptionTrackNotFound'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}

		const track = queue.tracks.at(delIndex);
		if(!track || track.id !== delId) {
			const embed = makeReplyEmbed()
				.setTitle(translator.getText('queueDequeueTitleTrackNotFound'))
				.setDescription(translator.getText('queueDequeueDescriptionTrackNotFound'));
			return interaction.reply({ embeds: [ embed ], ephemeral: true });
		}
		
		queue.removeTrack(track);
		return showQueuePage(interaction, 'DE', authorId, +page);
	});

module.exports = command;
