import { ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { CommandTags, Command } from '../Commons/';
import { Translator } from '../../i18n';
import { useMainPlayer } from 'discord-player';
import { tryRecoverSavedTracksQueue } from '../../models/playerQueue';
import { isPlayerUnavailable, SERVICES, makePuréMusicEmbed } from '../../systems/others/musicPlayer';

const tags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new Command('resumir', tags)
	.setAliases(
		'despausar',
		'resume',
		'unpause',
	)
	.setBriefDescription('Resume una pista de audio pausada')
	.setLongDescription(
		'Resume la reproducción de la pista de audio actual si es que estaba pausada',
	)
	.addWikiRow(
		new ButtonBuilder()
			.setCustomId('ayuda_showCommand_pausar')
			.setEmoji('1369424059871395950')
			.setLabel('¿Cómo pauso una pista?')
			.setStyle(ButtonStyle.Secondary),
	)
	.setExecution(async request => {
		const translator = await Translator.from(request.userId);

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

		await request.deferReply();

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));

		if(!queue?.currentTrack && !queue?.size) {
			const embed = makePuréMusicEmbed(request)
				.setTitle(translator.getText('resumirTitleNoTrack'));
			return request.editReply({
				embeds: [ embed ],
			});
		}

		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');

		if(!queue.currentTrack) {
			const trackToPlay = queue.tracks.at(0);
			if(!trackToPlay) {
				const embed = makePuréMusicEmbed(request)
					.setTitle(translator.getText('resumirTitleNoTrack'));
				return request.editReply({ embeds: [ embed ] });
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
			return request.editReply({ embeds: [ embed ] });
		}

		queue.node.resume();

		embed
			.setTitle(translator.getText('resumirTitleResumed'))
			.setTimestamp(Date.now());
		return request.editReply({ embeds: [ embed ] });
	});

export default command;
