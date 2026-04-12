import { ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { useMainPlayer } from 'discord-player';
import { Translator } from '@/i18n';
import { isPlayerUnavailable, makePuréMusicEmbed, SERVICES } from '@/systems/others/musicPlayer';
import { Command, CommandTags } from '../commons';

const tags = new CommandTags().add('COMMON', 'MUSIC');

const command = new Command('pausar', tags)
	.setAliases('pausa', 'pause')
	.setBriefDescription('Pausa una pista de audio en reproducción')
	.setLongDescription(
		'Pausa la reproducción de la pista de audio actual, si es que se estaba reproduciendo alguna.',
	)
	.addWikiRow(
		new ButtonBuilder()
			.setCustomId('ayuda_showCommand_resumir')
			.setEmoji('1369424059871395950')
			.setLabel('¿Cómo resumo una pista pausada?')
			.setStyle(ButtonStyle.Secondary),
	)
	.setExecution(async (request) => {
		const translator = await Translator.from(request.userId);

		const channel = request.member.voice?.channel;
		if (!channel)
			return request.reply({ content: translator.getText('voiceExpected'), flags: MessageFlags.Ephemeral });

		if (isPlayerUnavailable(channel))
			return request.reply({
				content: translator.getText('voiceSameChannelExpected'),
				flags: MessageFlags.Ephemeral,
			});

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId);

		if (!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(request).setTitle(
				translator.getText('pauseTitleNoTrack'),
			);
			return request.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const queueInfo = queue.size
			? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted)
			: translator.getText('playFooterTextQueueEmpty');
		const embed = makePuréMusicEmbed(request, service.color, service.iconUrl, [queueInfo])
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);

		if (queue.node.isPaused()) {
			embed.setTitle(translator.getText('pauseTitleTrackAlreadyPaused'));
			return request.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		queue.node.pause();

		embed.setTitle(translator.getText('pauseTitlePaused')).setTimestamp(Date.now());
		return request.reply({ embeds: [embed] });
	});

export default command;
