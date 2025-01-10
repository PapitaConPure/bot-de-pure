const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors } = require('discord.js'); //Integrar discord.js
const { shortenText } = require('../../func.js'); //Funciones globales
const {  } = require('../../localdata/config.json'); //Configuraciones
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandTags, CommandManager } = require('../Commons/commands.js');
const { showQueuePage, makePuréMusicEmbed, SERVICES } = require('../../systems/musicPlayer.js');
const { Translator } = require('../../internationalization.js');
const { tryRecoverSavedTracksQueue } = require('../../localdata/models/playerQueue.js');
const { useMainPlayer } = require('discord-player');

const flags = new CommandTags().add(
	'COMMON',
	'MUSIC',
);

const command = new CommandManager('sonando', flags)
	.setAliases(
		'reproduciendo',
		'escuchando',
		'playing',
		'listening',
		'np',
	)
	.setBriefDescription('Indica la pista que está sonando actualmente')
	.setLongDescription(
		'Indica la pista que está sonando (si hay alguna) en el chat de voz en el que estoy conectada',
	)
	.setExperimentalExecution(async (request, args) => {
		const [ translator ] = await Promise.all([
			Translator.from(request.user),
			request.deferReply(),
		]);

		/**@param {import('discord.js').ColorResolvable} color*/
		const makeReplyEmbed = (color) => new EmbedBuilder()
			.setColor(color)
			.setTitle(translator.getText('sonandoTitle'))
			.setAuthor({
				name: request.member.displayName,
				iconURL: request.member.displayAvatarURL({ size: 128 }),
			});

		try {
			const player = useMainPlayer();
			const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));

			if(!queue?.currentTrack && !queue?.size)
				return request.editReply(translator.getText('queueDescriptionEmptyQueue'));

			const shortChannelName = shortenText(request.member.voice.channel.name, 20);
			const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
			const footerText = `${shortChannelName} • ${queueInfo}`;

			const currentTrack = queue.currentTrack;
			const isPaused = queue.node.isPaused();
			const progressBar = isPaused ? '' : `\n${queue.node.createProgressBar({
				length: 16,
				queue: false,
				timecodes: false,
				leftChar:  '▰',
				indicator: '',
				rightChar: '▱',
			})}`;

			const service = SERVICES[currentTrack.source];
			return request.editReply({
				embeds: [
					makeReplyEmbed(service.color)
						.setThumbnail(currentTrack.thumbnail)
						.addFields({
							name: `${isPaused ? '0.' : translator.getText('queueNowPlayingName')}  ⏱️ ${currentTrack.duration}${ currentTrack.requestedBy ? `  👤 ${currentTrack.requestedBy.username}` : '' }`,
							value: `[${currentTrack.title}](${currentTrack.url})${progressBar}`,
						})
						.setFooter({
							text: footerText,
							iconURL: service.iconUrl,
						})
						.setTimestamp(Date.now()),
				],
				components: [
					new ActionRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId('sonando_expand')
								.setStyle(ButtonStyle.Secondary)
								.setLabel(translator.getText('buttonExpand'))
								.setEmoji(''),
					),
				]
			});
		} catch(e) {
			console.error(e);

			const errorEmbed = makePuréMusicEmbed(request, 0x990000, null)
				.setTitle(translator.getText('somethingWentWrong'))
				.addFields({
					name: 'Error',
					value: `\`\`\`\n${e?.message ?? e?.name ?? e ?? 'Error desconocido'}\n\`\`\``,
				});
			return request.editReply({ embeds: [ errorEmbed ] });
		}
	}).setButtonResponse(async function expand(interaction, authorId) {
		return showQueuePage(interaction, 'CU', authorId, 0);
	}, { userFilterIndex: 0 });

module.exports = command;
