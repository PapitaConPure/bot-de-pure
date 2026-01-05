const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { CommandOptions, CommandTags, Command, CommandParam } = require('../Commons/commands.js');
const { useMainPlayer } = require('discord-player');
const { Translator } = require('../../i18n/internationalization');
const { saveTracksQueue, tryRecoverSavedTracksQueue } = require('../../models/playerQueue.js');
const { isPlayerUnavailable, SERVICES } = require('../../systems/others/musicPlayer');
const { shortenText } = require('../../func');

const options = new CommandOptions()
	.addOptions(
		new CommandParam('búsqueda', 'TEXT')
			.setDesc('para realizar una búsqueda')
			.setAutocomplete(async (interaction, query) => {
				if(!query)
					return interaction.respond([]);

				const player = useMainPlayer();
				const results = await player.search(query, {
					searchEngine: 'auto',
					fallbackSearchEngine: 'autoSearch',
				});

				return interaction.respond(
					results.tracks
						.filter(t => t.url.length <= 100)
						.slice(0, 10)
						.map(t => ({
							name: shortenText(t.title, 100),
							value: t.url,
						})),
				);
			})
	);

const tags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new Command('reproducir', tags)
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
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.userId);

		if(args.empty)
			return request.reply({ content: translator.getText('playSearchExpected'), ephemeral: true });

		const channel = request.member.voice?.channel;
		if(!channel)
			return request.reply({ content: translator.getText('voiceExpected') });

		if(isPlayerUnavailable(channel))
			return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
		
		const query = args.getString('búsqueda', true);
		if(!query)
			return request.reply({ content: translator.getText('playSearchExpected'), ephemeral: true });

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
			await tryRecoverSavedTracksQueue(request, false);

			const player = useMainPlayer();
			const { track, queue } = await player.play(channel, query, {
				nodeOptions: { metadata: request },
			});

			const service = SERVICES[track.source];
			const trackSourceName = service.name ?? translator.getText('playValueTrackSourceArbitrary');
			const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
			const trackEmbed = makeReplyEmbed(service.color)
				.setTitle(queue.size ? translator.getText('playTitleQueueAdded') : translator.getText('playTitleQueueNew'))
				.setDescription(`[${track.title}](${track.url})`)
				.setThumbnail(track.thumbnail || request.client.user.displayAvatarURL({ size: 256 }))
				.setFooter({
					text: `${channel.name ?? '???'} • ${queueInfo}`,
					iconURL: service.iconUrl || request.client.user.displayAvatarURL({ size: 256 }),
				})
				.addFields(
					{
						name: translator.getText('duration'),
						value: track.duration,
						inline: true,
					},
					{
						name: translator.getText('source'),
						value: trackSourceName,
						inline: true,
					},
				);

			return Promise.all([
				saveTracksQueue(request, queue),
				request.editReply({ embeds: [ trackEmbed ] }),
			]);
		} catch (e) {
			console.error(e);

			const errorEmbed = makeReplyEmbed(0x990000)
				.setTitle(translator.getText('somethingWentWrong'))
				.addFields({
					name: 'Error',
					value: `\`\`\`\n${e?.message ?? e?.name ?? e ?? 'Error desconocido'}\n\`\`\``,
				});
			return request.editReply({ embeds: [ errorEmbed ] });
		}
	});

module.exports = command;
