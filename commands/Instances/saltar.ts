import { CommandTags, Command } from '../Commons/';
import { Colors, MessageFlags } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { isPlayerUnavailable, SERVICES, makePuréMusicEmbed } from '../../systems/others/musicPlayer.js';
import { tryRecoverSavedTracksQueue } from '../../models/playerQueue.js';
import { Translator } from '../../i18n';

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
				return request.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceExpected'),
				});
	
			if(isPlayerUnavailable(channel))
				return request.reply({
					flags: MessageFlags.Ephemeral,
					content: translator.getText('voiceSameChannelExpected'),
				});
	
			const player = useMainPlayer();
			const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));
			if(!queue?.currentTrack) {
				const embed = makePuréMusicEmbed(request)
					.setTitle(translator.getText('queueSkipTitleNoTrack'));
				return request.reply({
					flags: MessageFlags.Ephemeral,
					embeds: [ embed ],
				});
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

export default command;
