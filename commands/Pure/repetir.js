const { Colors, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js'); //Integrar discord.js
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { useMainPlayer, QueueRepeatMode } = require('discord-player');
const { isPlayerUnavailable, makePuréMusicEmbed, SERVICES } = require('../../systems/musicPlayer.js');
const { Translator } = require('../../internationalization.js');
const { tryRecoverSavedTracksQueue } = require('../../localdata/models/playerQueue.js');
const { makeStringSelectMenuRowBuilder } = require('../../tsCasts.js');

const tags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new CommandManager('repetir', tags)
	.setAliases(
		'bucle', 'autodj',
		'loop', 'repeat',
		'dj', 'l',
	)
	.setBriefDescription('Salta la pista actual')
	.setLongDescription(
		'Detiene la pista que se esté reproduciendo actualmente en VC y comienza a reproducir en su lugar la que se encuentre a continuación en la cola de reproducción',
	)
	.setExecution(async request => {
		const userId = request.userId;
		const translator = await Translator.from(userId);

		const channel = request.member.voice?.channel;
		if(!channel)
			return request.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		const embed = makePuréMusicEmbed(request)
			.setTitle(translator.getText('queueLoopTitle'));

		const row = makeStringSelectMenuRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('repetir_setLoopMode')
				.setPlaceholder(translator.getText('queueLoopMenuPlaceholder'))
				.setOptions(
					new StringSelectMenuOptionBuilder()
						.setValue('off')
						.setLabel(translator.getText('disabled'))
						.setDescription(translator.getText('queueLoopMenuOffDesc')),
					new StringSelectMenuOptionBuilder()
						.setValue('track')
						.setLabel(translator.getText('queueLoopMenuTrackLabel'))
						.setDescription(translator.getText('queueLoopMenuTrackDesc')),
					new StringSelectMenuOptionBuilder()
						.setValue('queue')
						.setLabel(translator.getText('queueLoopMenuQueueLabel'))
						.setDescription(translator.getText('queueLoopMenuQueueDesc')),
					new StringSelectMenuOptionBuilder()
						.setValue('autoplay')
						.setLabel(translator.getText('queueLoopMenuAutoplayLabel'))
						.setDescription(translator.getText('queueLoopMenuAutoplayDesc')),
				),
			);

		return request.reply({
			embeds: [embed],
			components: [row],
		}).catch(console.error);
	}).setSelectMenuResponse(async function setLoopMode(interaction) {
		const userId = interaction.user.id;
		const translator = await Translator.from(userId);

		const channel = interaction.member.voice?.channel;
		if(!channel)
			return interaction.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		try {
			if(isPlayerUnavailable(channel))
				return interaction.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

			const player = useMainPlayer();
			const queue = player.queues.get(interaction.guildId) ?? (await tryRecoverSavedTracksQueue(interaction));
			if(!queue?.currentTrack) {
				const embed = makePuréMusicEmbed(interaction)
					.setTitle(translator.getText('queueLoopTitleNoTrack'));
				return interaction.reply({
					embeds: [embed],
					ephemeral: true,
				});
			}
			
			const [ loopMode ] = interaction.values;

			let embed;

			switch(loopMode) {
			case 'off':
				queue.setRepeatMode(QueueRepeatMode.OFF);
				embed = makePuréMusicEmbed(interaction)
					.setTitle(translator.getText('queueLoopOffTitle'))
					.setTimestamp(Date.now());

				break;

			case 'track': {
				const {
					title: skippedTitle,
					url: skippedUrl,
					thumbnail: skippedThumbnail
				} = queue.currentTrack;

				const service = SERVICES[queue.currentTrack.source];
				const queueInfo = queue.size
					? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted)
					: translator.getText('playFooterTextQueueEmpty');

				queue.setRepeatMode(QueueRepeatMode.TRACK);
				embed = makePuréMusicEmbed(interaction, service.color, service.iconUrl, [ queueInfo ])
					.setTitle(translator.getText('queueLoopTrackTitle'))
					.setDescription(`[${skippedTitle}](${skippedUrl})`)
					.setThumbnail(skippedThumbnail)
					.setTimestamp(Date.now());

				break;
			}

			case 'queue':
				queue.setRepeatMode(QueueRepeatMode.QUEUE);
				embed = makePuréMusicEmbed(interaction)
					.setTitle(translator.getText('queueLoopQueueTitle'))
					.setTimestamp(Date.now());

				break;

			case 'autoplay':
				queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
				embed = makePuréMusicEmbed(interaction, Colors.LuminousVividPink)
					.setTitle(translator.getText('queueLoopAutoplayTitle'))
					.setTimestamp(Date.now());

				break;

			default:
				throw new RangeError('El modo de bucle indicado no está disponible.');
			}

			return interaction.update({
				embeds: [embed],
				components: [],
			});
		} catch(err) {
			console.error(err);
			const embed = makePuréMusicEmbed(interaction, Colors.Red)
				.setTitle(translator.getText('somethingWentWrong'));

			return interaction.reply({ embeds: [embed] });
		}
	});

module.exports = command;
