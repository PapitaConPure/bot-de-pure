const { EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { shortenText } = require('../../func.js');
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');
const { isPlayerUnavailable, SERVICES } = require('../../systems/musicPlayer.js');

const tags = new CommandTags().add('COMMON');

const command = new CommandManager('pausar', tags)
	.setAliases(
		'pausa',
		'pause',
	)
	.setBriefDescription('Pausa una pista de audio en reproducción')
	.setLongDescription(
		'Pausa la reproducción de la pista de audio actual si es que se estaba reproduciendo alguna',
	)
	.setExperimentalExecution(async (request, args) => {
		const [ translator ] = await Promise.all([
			Translator.from(request.userId),
			request.deferReply(),
		]);

		const channel = request.member.voice?.channel;
		if(!channel)
			return request.editReply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return request.editReply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
		
		/**
		 * @param {import('discord.js').ColorResolvable} color
		 * @param {String} [iconUrl]
		 */
		const makeReplyEmbed = (color, iconUrl = 'https://i.imgur.com/irsTBIH.png') => new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: request.member.displayName,
				iconURL: request.member.displayAvatarURL({ size: 128 }),
			})
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: iconUrl,
			});

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId);

		if(!queue?.currentTrack) {
			const embed = makeReplyEmbed(Colors.Blurple)
				.setTitle(translator.getText('pauseTitleNoTrack'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const embed = makeReplyEmbed(service.color, service.iconUrl)
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);
		
		if(queue.node.isPaused()) {
			embed.setTitle(translator.getText('pauseTitleTrackAlreadyPaused'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.pause();

		embed.setTitle(translator.getText('pauseTitlePaused'));
		return request.editReply({ embeds: [ embed ] });
	});

module.exports = command;
