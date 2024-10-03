const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { shortenText } = require('../../func.js');
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');
const { tryRecoverSavedTracksQueue } = require('../../localdata/models/playerQueue.js');

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
		
		const makeReplyEmbed = () => new EmbedBuilder()
			.setColor(0xff0000)
			.setAuthor({ name: request.member.displayName, iconURL: request.member.displayAvatarURL({ size: 128 }) })
			.setFooter({
				text: `${shortenText(channel.name, 32)}`,
				iconURL: 'https://i.imgur.com/irsTBIH.png',
			});

		const player = useMainPlayer();
		const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));

		if(!queue?.currentTrack) {
			const embed = makeReplyEmbed()
				.setTitle(translator.getText('pauseTitleNoTrack'));
			return request.editReply({ embeds: [ embed ], ephemeral: true });
		}

		const currentTrack = queue.currentTrack;
		const embed = makeReplyEmbed()
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
