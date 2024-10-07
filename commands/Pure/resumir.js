const { EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { shortenText } = require('../../func.js');
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');
const { tryRecoverSavedTracksQueue } = require('../../localdata/models/playerQueue.js');
const { isPlayerUnavailable, SERVICES, makePuréMusicEmbed } = require('../../systems/musicPlayer.js');

const tags = new CommandTags().add('COMMON');

const command = new CommandManager('resumir', tags)
	.setAliases(
		'despausar',
		'resume',
		'unpause',
	)
	.setBriefDescription('Resume una pista de audio pausada')
	.setLongDescription(
		'Resume la reproducción de la pista de audio actual si es que estaba pausada',
	)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		const channel = request.member.voice?.channel;
		if(!channel)
			return request.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		await request.deferReply();

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));

		if(!queue?.currentTrack && !queue?.size) {
			const embed = makePuréMusicEmbed(request)
				.setTitle(translator.getText('resumirTitleNoTrack'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');

		if(!queue.currentTrack) {
			const trackToPlay = queue.tracks.at(0);
			if(!trackToPlay) {
				const embed = makePuréMusicEmbed(request)
					.setTitle(translator.getText('resumirTitleNoTrack'));
				return request.editReply({ embeds: [ embed ], ephemeral: true });
			}
			
			const service = SERVICES[trackToPlay.source];
			const embed = makePuréMusicEmbed(request, service.color, service.iconUrl, [ queueInfo ])
				.setTitle(translator.getText('resumirTitleResumed'))
				.setDescription(`[${trackToPlay.title}](${trackToPlay.url})`)
				.setThumbnail(trackToPlay.thumbnail);
			return request.editReply({ embeds: [ embed ] });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const embed = makePuréMusicEmbed(request, service.color, service.iconUrl, [ queueInfo ])
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);
		
		if(!queue.node.isPaused() && queue.node.isPlaying()) {
			embed.setTitle(translator.getText('resumirTitleTrackAlreadyResumed'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.resume();

		embed
			.setTitle(translator.getText('resumirTitleResumed'))
			.setTimestamp(Date.now());
		return request.editReply({ embeds: [ embed ] });
	});

module.exports = command;
