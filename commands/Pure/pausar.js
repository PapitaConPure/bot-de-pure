const { ButtonBuilder, ButtonStyle } = require('discord.js'); //Integrar discord.js
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');
const { isPlayerUnavailable, SERVICES, makePuréMusicEmbed } = require('../../systems/musicPlayer.js');

const tags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new CommandManager('pausar', tags)
	.setAliases(
		'pausa',
		'pause',
	)
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
	.setExecution(async request => {
		const translator = await Translator.from(request.userId);

		const channel = request.member.voice?.channel;
		if(!channel)
			return request.reply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId);

		if(!queue?.currentTrack) {
			const embed = makePuréMusicEmbed(request)
				.setTitle(translator.getText('pauseTitleNoTrack'));
			return request.reply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
		const embed = makePuréMusicEmbed(request, service.color, service.iconUrl, [ queueInfo ])
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);
		
		if(queue.node.isPaused()) {
			embed.setTitle(translator.getText('pauseTitleTrackAlreadyPaused'));
			return request.reply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.pause();

		embed
			.setTitle(translator.getText('pauseTitlePaused'))
			.setTimestamp(Date.now());
		return request.reply({ embeds: [ embed ] });
	});

module.exports = command;
