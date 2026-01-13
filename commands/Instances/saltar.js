const { Colors } = require('discord.js'); //Integrar discord.js
const { CommandTags, Command } = require('../Commons/');
const { useMainPlayer } = require('discord-player');
const { isPlayerUnavailable, SERVICES, makePuréMusicEmbed } = require('../../systems/others/musicPlayer.js');
const { Translator } = require('../../i18n');
const { tryRecoverSavedTracksQueue } = require('../../models/playerQueue.js');

const tags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new Command('saltar', tags)
	.setAliases(
		'skip',
		's',
	)
	.setBriefDescription('Salta la pista actual')
	.setLongDescription(
		'Detiene la pista que se esté reproduciendo actualmente en VC y comienza a reproducir en su lugar la que se encuentre a continuación en la cola de reproducción',
	)
	.setExecution(async request => {
		const userId = request.userId;
		const translator = await Translator.from(userId);
		
		try {
			const channel = request.member.voice?.channel;
			if(!channel)
				return request.reply({ content: translator.getText('voiceExpected'), ephemeral: true });
	
			if(isPlayerUnavailable(channel))
				return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
	
			const player = useMainPlayer();
			const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));
			if(!queue?.currentTrack) {
				const embed = makePuréMusicEmbed(request)
					.setTitle(translator.getText('queueSkipTitleNoTrack'));
				return request.reply({ embeds: [ embed ], ephemeral: true });
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
			const queueInfo = queue.size
				? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted)
				: translator.getText('playFooterTextQueueEmpty');
			const embed = makePuréMusicEmbed(request, service.color, service.iconUrl, [ queueInfo ])
				.setTitle(translator.getText('queueSkipTitleSkipped'))
				.setDescription(`[${skippedTitle}](${skippedUrl})`)
				.setThumbnail(skippedThumbnail)
				.setTimestamp(Date.now());
			return request.reply({ embeds: [ embed ] }).catch(console.error);
		} catch {
			const embed = makePuréMusicEmbed(request, Colors.Red)
				.setTitle(translator.getText('somethingWentWrong'));

			return request.reply({ embeds: [embed] });
		}
	});

module.exports = command;
