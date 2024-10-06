const { EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { shortenText } = require('../../func.js');
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');
const { tryRecoverSavedTracksQueue } = require('../../localdata/models/playerQueue.js');
const { isPlayerUnavailable, SERVICES } = require('../../systems/musicPlayer.js');

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
		const [ translator ] = await Promise.all([
			Translator.from(request.userId),
			request.deferReply(),
		]);

		const channel = request.member.voice?.channel;
		if(!channel)
			return request.editReply({ content: translator.getText('voiceExpected'), ephemeral: true });

		if(isPlayerUnavailable(channel))
			return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
		
		/**
		 * @param {import('discord.js').ColorResolvable} color 
		 * @param {String} [iconUrl]
		 */
		const makeReplyEmbed = (color, iconUrl = 'https://i.imgur.com/irsTBIH.png') => new EmbedBuilder()
			.setColor(color)
			.setAuthor({ name: request.member.displayName, iconURL: request.member.displayAvatarURL({ size: 128 }) })
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: iconUrl,
			});

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));

		if(!queue?.currentTrack && !queue?.size) {
			const embed = makeReplyEmbed(Colors.Blurple)
				.setTitle(translator.getText('resumirTitleNoTrack'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		if(!queue.currentTrack) {
			const trackToPlay = queue.tracks.at(0);
			if(!trackToPlay) {
				const embed = makeReplyEmbed(Colors.Blurple)
					.setTitle(translator.getText('resumirTitleNoTrack'));
				return request.editReply({ embeds: [ embed ], ephemeral: true });
			}
			
			const service = SERVICES[trackToPlay.source];
			const embed = makeReplyEmbed(service.color, service.iconUrl)
				.setTitle(translator.getText('resumirTitleResumed'))
				.setDescription(`[${trackToPlay.title}](${trackToPlay.url})`)
				.setThumbnail(trackToPlay.thumbnail);
			return request.editReply({ embeds: [ embed ] });
		}

		const currentTrack = queue.currentTrack;
		const service = SERVICES[currentTrack.source];
		const embed = makeReplyEmbed(service.color, service.iconUrl)
			.setDescription(`[${currentTrack.title}](${currentTrack.url})`)
			.setThumbnail(currentTrack.thumbnail);
		
		if(!queue.node.isPaused() && queue.node.isPlaying()) {
			embed.setTitle(translator.getText('resumirTitleTrackAlreadyResumed'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		queue.node.resume();

		embed.setTitle(translator.getText('resumirTitleResumed'));
		return request.editReply({ embeds: [ embed ] });
	});

module.exports = command;
