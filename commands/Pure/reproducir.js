const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands.js');
const { Translator } = require('../../internationalization.js');
const { useMainPlayer } = require('discord-player');

const options = new CommandOptions()
	.addParam('búsqueda', 'TEXT', 'para realizar una búsqueda de YouTube');

const tags = new CommandTags().add('COMMON');

const command = new CommandManager('reproducir', tags)
	.setAliases(
		'tocar',
		'play',
		'p',
	)
	.setBriefDescription('Reproduce pistas de audio')
	.setLongDescription(
		'Reproduce una pista de audio según la `búsqueda` realizada.',
	)
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		if(args.empty)
			return request.reply({ content: translator.getText('playSearchExpected'), ephemeral: true });

		const player = useMainPlayer();
		const channel = request.member.voice?.channel;

		if(!channel)
			return request.reply(translator.getText('voiceExpected'));
		
		const query = args.getString('búsqueda', true);
		await request.deferReply();

		/**@param {import('discord.js').ColorResolvable} color*/
		const makeReplyEmbed = (color) => new EmbedBuilder()
			.setColor(color)
			.setAuthor({
				name: request.member.displayName,
				iconURL: request.member.displayAvatarURL({ size: 128 })
			})
			.setTimestamp(Date.now());
		try {
			const { track, queue } = await player.play(channel, query, {
				nodeOptions: { metadata: request },
			});

			const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size) : translator.getText('playFooterTextQueueEmpty');
			const videoEmbed = makeReplyEmbed(0xff0000)
				.setTitle(queue.size ? translator.getText('playTitleQueueAdded') : translator.getText('playTitleQueueNew'))
				.setDescription(`[${track.title}](${track.url})`)
				.setThumbnail(track.thumbnail)
				.setFooter({
					text: `${channel.name} • ${queueInfo}`,
					iconURL: 'https://i.imgur.com/irsTBIH.png',
				});

			return request.editReply({ embeds: [ videoEmbed ] });
		} catch (e) {
			console.error(e);

			const errorEmbed = makeReplyEmbed(0x990000)
				.setTitle(translator.getText('somethingWentWrong'));

			return request.editReply({ embeds: [ errorEmbed ] });
		}
	});

module.exports = command;
