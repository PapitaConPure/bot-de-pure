import { Player, useMainPlayer, QueueRepeatMode, Track, GuildQueue } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { SoundcloudExtractor } from 'discord-player-soundcloud';
import { YoutubeSabrExtractor } from 'discord-player-googlevideo';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, Colors, Client, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction, ColorResolvable, BaseGuildVoiceChannel } from 'discord.js';
import { ComplexCommandRequest, ComponentInteraction } from '../../commands/Commons/typings';
import { makeButtonRowBuilder, makeStringSelectMenuRowBuilder } from '../../utils/tsCasts';
import { tryRecoverSavedTracksQueue, saveTracksQueue } from '../../models/playerQueue';
import { compressId, decompressId, shortenText } from '../../func';
import { Translator } from '../../i18n';

import Logger from '../../utils/logs';
const { debug, info, warn, error } = Logger('DEBUG', 'PuréMusic');

export function makePuréMusicEmbed(
	request: ComplexCommandRequest | ComponentInteraction | ModalSubmitInteraction<'cached'>,
	color: ColorResolvable = Colors.Blurple,
	iconUrl: string = 'https://cdn.discordapp.com/emojis/1354500099799257319.webp?size=32&quality=lossless',
	additionalFooterData: string[] = [],
) {
	const { channel } = request.member.voice;

	const footerExtraContent = additionalFooterData.length ? ` • ${additionalFooterData.join(' • ')}` : '';

	const embed = new EmbedBuilder()
		.setColor(color)
		.setAuthor({
			name: request.member.displayName,
			iconURL: request.member.displayAvatarURL({ size: 128 }),
		});

	if(iconUrl != null)
		embed.setFooter({
			text: `${shortenText(channel.name, 32)}${footerExtraContent}`,
			iconURL: iconUrl,
		});

	return embed;
}

export interface BaseServiceInfo {
	color: number;
	iconUrl: string;
}

export interface KnownServiceInfo extends BaseServiceInfo {
	name: string;
	isArbitrary: false;
}

export interface ArbitraryServiceInfo extends BaseServiceInfo {
	name: null;
	isArbitrary: true;
}

export type ServiceInfo = KnownServiceInfo | ArbitraryServiceInfo;

/**@satisfies {Record<string, ServiceInfo>}*/
export const SERVICES = ({
	youtube:      { name: 'YouTube',      color: 0xff0000, iconUrl: 'https://i.imgur.com/0k9tFqd.png', isArbitrary: false },
	spotify:      { name: 'Spotify',      color: 0x1db954, iconUrl: 'https://i.imgur.com/qpCz3Ug.png', isArbitrary: false },
	soundcloud:   { name: 'SoundCloud',   color: 0xff7e19, iconUrl: 'https://i.imgur.com/UVx6eva.png', isArbitrary: false },
	apple_music:  { name: 'Apple Music',  color: 0xfc334a, iconUrl: 'https://i.imgur.com/Nw0aLwN.png', isArbitrary: false },
	vimeo:        { name: 'Vimeo',        color: 0x9e3845, iconUrl: 'https://i.imgur.com/LC5Ic3R.png', isArbitrary: false },
	reverbnation: { name: 'Reverbnation', color: 0x9e3845, iconUrl: 'https://i.imgur.com/LC5Ic3R.png', isArbitrary: false },
	arbitrary:    { name: null,           color: 0x9e3845, iconUrl: 'https://i.imgur.com/LC5Ic3R.png', isArbitrary: true  },
}) as const;
export type ServiceKey = (typeof Track.prototype.source) & string;

/**Cantidad máxima de pistas por página al mostrar la cola de reproducción*/
const QUEUE_PAGE_TRACKS_MAX = 5;

export async function prepareTracksPlayer(client: Client) {
	const player = new Player(client, {
		lagMonitor: -1,
	});
	info('Music Player created.');

	debug('Loading YouTube extractor...');
	await player.extractors.register(YoutubeSabrExtractor, {
		streamOptions: {
			highWaterMark: 1 << 25,
		},
	});
	debug('Loading Soundcloud extractor...');
	await player.extractors.register(SoundcloudExtractor, {});
	debug('Loading default extractors...');
	await player.extractors.loadMulti(DefaultExtractors.filter(ext => ext.identifier !== 'com.discord-player.soundcloudextractor'));
	info('Extractors have been loaded.');

	player.on('debug', debug);
	player.on('error', (err) => {
		error(err, `Error emitted from the player: ${err.message}`);
	});
	
	player.events.on('playerFinish', (queue) => {
		saveTracksQueue(queue.metadata, queue);
	});
	player.events.on('connectionDestroyed', (queue) => {
		info(`[${queue.guild.name}] Connection destroyed`);
	});
	player.events.on('error', (err) => {
		warn('Error general de reproductor');
		warn({ err });
	});
	player.events.on('playerError', (queue, err) => {
		error(err, 'Error de reproductor');
		info({ queue });
	});
}

/**
 * Muestra una página de la queue de la Guild actual
 * @param request El request que desencadenó esta petición
 * @param op La operación particular que desencadena esta función
 * @param authorId ID del autor para verificar permisos de botón
 * @param page Número de página, enumerado desde 0 y por defecto 0
 */
export async function showQueuePage(request: ComplexCommandRequest | ButtonInteraction<'cached'> | StringSelectMenuInteraction<'cached'> | ModalSubmitInteraction<'cached'>, op: string = undefined, authorId: string = undefined, page: number = 0) {
	const translator = await Translator.from(request.user.id);

	if(authorId && request.user.id !== decompressId(authorId))
		return request.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
	
	const channel = request.member.voice?.channel;
	if(!channel)
		return (request.reply)({ content: translator.getText('voiceExpected'), ephemeral: true });

	if(isPlayerUnavailable(channel))
		return request.reply({ content: translator.getText('voiceSameChannelExpected'), ephemeral: true });
	
	const shortChannelName = shortenText(channel.name, 20);

	/**@param {ColorResolvable} color*/
	const makeReplyEmbed = (color: ColorResolvable) => new EmbedBuilder()
		.setColor(color)
		.setTitle(translator.getText('queueTitle'))
		.setAuthor({
			name: request.member.displayName,
			iconURL: request.member.displayAvatarURL({ size: 128 }),
		});
	
	if(op !== 'PL') {
		await (
			(!op || op === 'CM')
				? request.deferReply()
				: (request as ButtonInteraction<'cached'>).deferUpdate()
		);
	}

	const player = useMainPlayer();
	const queue = player.queues.get(request.guildId) ?? (await tryRecoverSavedTracksQueue(request));
	const fullRows = [ 'EX', 'SF', 'AP', 'RP', 'LP' ].includes(op);

	if(!queue?.currentTrack && !queue?.size) {
		const embed = makeReplyEmbed(Colors.Blurple)
			.setDescription(translator.getText('queueDescriptionEmptyQueue'))
			.setFooter({
				text: `${shortChannelName}`,
				iconURL: 'https://cdn.discordapp.com/emojis/1354500099799257319.webp?size=32&quality=lossless',
			});

		const replyObj = {
			embeds: [ embed ],
			components: [
				getTrackActionRow(queue, page, request.user.id, fullRows),
			],
		};
		return request.editReply(replyObj);
	}

	let offset = page * QUEUE_PAGE_TRACKS_MAX;
	while(queue.size && offset >= queue.size)
		offset = (op === 'DE') ? Math.max(0, offset - QUEUE_PAGE_TRACKS_MAX) : 0;
	
	const tracks = queue.tracks.toArray().slice(offset, offset + QUEUE_PAGE_TRACKS_MAX);
	const queueInfo = queue.size ? translator.getText('playFooterTextQueueSize', queue.size, queue.durationFormatted) : translator.getText('playFooterTextQueueEmpty');
	
	const lastPage = queue.size ? (Math.ceil(queue.size / QUEUE_PAGE_TRACKS_MAX) - 1) : 0;
	const previousPage = page === 0 ? lastPage : page - 1;
	const nextPage = page === lastPage ? 0 : page + 1;
	const footerText = `${shortChannelName} • ${queueInfo}`;
	const labels = [];

	let queueEmbed;
	
	if(queue.currentTrack) {
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
		queueEmbed = makeReplyEmbed(service.color)
			.setThumbnail(currentTrack.thumbnail ?? request.client.user.displayAvatarURL())
			.addFields({
				name: `${isPaused ? '0.' : translator.getText('queueNowPlayingName')}  ⏱️ ${currentTrack.duration}${ currentTrack.requestedBy ? `  👤 ${currentTrack.requestedBy.username}` : '' }`,
				value: `[${currentTrack.title}](${currentTrack.url})${progressBar}`,
			})
			.setFooter({
				text: footerText,
				iconURL: service.iconUrl,
			});

		switch(queue.repeatMode) {
		case QueueRepeatMode.TRACK:
			labels.push(translator.getText('queueDescriptionLoopTrack'));
			break;
		case QueueRepeatMode.QUEUE:
			labels.push(translator.getText('queueDescriptionLoopQueue'));
			break;
		case QueueRepeatMode.AUTOPLAY:
			labels.push(translator.getText('queueDescriptionLoopAutoplay'));
			break;
		}
	} else {
		queueEmbed = makeReplyEmbed(Colors.Blurple)
			.setFooter({
				text: footerText,
				iconURL: 'https://cdn.discordapp.com/emojis/1354500099799257319.webp?size=32&quality=lossless',
			});
	}

	if(queue.isShuffling)
		labels.push(translator.getText('queueDescriptionShuffle'));

	if(labels.length)
		queueEmbed.setDescription(labels.join('\n'));
	
	queueEmbed
		.addFields(...tracks.map((t, i) => ({
			name: `${i + offset + 1}.  ⏱️ ${t.duration}${ t.requestedBy ? `  👤 ${t.requestedBy.username}` : '' }`,
			value: `[${t.title || '<<???>>'}](${t.url})`,
		})))
		.setTimestamp(Date.now());
	
	const compressedUserId = compressId(request.user.id);

	const components = [];

	if(queue.size) {
		const menuRow = makeStringSelectMenuRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(`cola_dequeue_${compressedUserId}_${page}`)
				.setPlaceholder(translator.getText('queueMenuDequeuePlaceholder'))
				.setMaxValues(1)
				.addOptions(tracks.map((t, i) => ({
					label: shortenText(t.title, 48),
					value: `${page}:${i}:${t.id}`,
				})))
		);

		components.push(menuRow);

		if(queue.size > QUEUE_PAGE_TRACKS_MAX) {
			const navigationRow = makeButtonRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`cola_showPage_FP_${compressedUserId}_0`)
					.setEmoji('1357002075531382805')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_PV_${compressedUserId}_${previousPage}`)
					.setEmoji('934430008343158844')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_IN_${compressedUserId}_${previousPage}`)
					.setLabel(`${page + 1}/${lastPage + 1}`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_NX_${compressedUserId}_${nextPage}`)
					.setEmoji('934430008250871818')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`cola_showPage_LP_${compressedUserId}_${lastPage}`)
					.setEmoji('1356975962990051472')
					.setStyle(ButtonStyle.Secondary),
			);

			components.push(navigationRow);
		}
	}

	const trackRow = getTrackActionRow(queue, page, request.user.id, fullRows);
	components.push(trackRow);
	
	if(fullRows) {
		const queueRow = getQueueActionRow(queue, page, request.user.id, translator);
		components.push(queueRow);
	}

	const replyObj = {
		embeds: [ queueEmbed ],
		components,
	};
	return request.editReply(replyObj);
}

function getTrackActionRow(queue: import('discord-player').GuildQueue, page: number, userId: string, fullRows: boolean) {
	const compressedUserId = compressId(userId);

	const actionRow = makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`cola_add_${compressedUserId}_${page}`)
			.setEmoji('1291900911643263008')
			.setStyle(ButtonStyle.Success),
	);

	if(!queue)
		return actionRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`cola_showPage_CU_${compressedUserId}_${page}`)
				.setEmoji('1357001126674825379')
				.setStyle(ButtonStyle.Primary),
		);

	if(queue.currentTrack) {
		const pauseOrResumeButton = queue.node.isPaused()
			? new ButtonBuilder()
				.setCustomId(`cola_resume_${compressedUserId}_${page}`)
				.setEmoji('1356977685468942416')
				.setStyle(ButtonStyle.Primary)
			: new ButtonBuilder()
				.setCustomId(`cola_pause_${compressedUserId}_${page}`)
				.setEmoji('1356977691122995371')
				.setStyle(ButtonStyle.Primary);
		
		actionRow.addComponents(
			pauseOrResumeButton,
			new ButtonBuilder()
				.setCustomId(`cola_skip_${compressedUserId}_${page}`)
				.setEmoji('1356974499542732902')
				.setStyle(ButtonStyle.Primary),
		);
	}

	actionRow.addComponents(
		new ButtonBuilder()
			.setCustomId(`cola_showPage_${fullRows ? 'NX' : 'EX'}_${compressedUserId}_${page}`)
			.setEmoji('1357007956947767498')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`cola_showPage_CU_${compressedUserId}_${page}`)
			.setEmoji('1357001126674825379')
			.setStyle(ButtonStyle.Secondary),
	);

	return actionRow;
}

function getQueueActionRow(queue: GuildQueue, page: number, userId: string, translator: Translator) {
	const compressedUserId = compressId(userId);

	const actionRow = makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`cola_autoplay_${compressedUserId}_${page}`)
			.setEmoji('1360868342411427892')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`cola_repeat_${compressedUserId}_${page}`)
			.setEmoji('1356977712149037087')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`cola_shuffle_${compressedUserId}_${page}`)
			.setEmoji(queue.isShuffling ? '1356993337843781722' : '1356977721799868426')
			.setStyle(ButtonStyle.Primary),
	);

	if(queue.size)
		actionRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`cola_clearQueue_${compressedUserId}`)
				.setEmoji('1355143793577426962')
				.setLabel(translator.getText('queueButtonClearQueue'))
				.setStyle(ButtonStyle.Danger),
		);

	return actionRow;
}

export function getPageAndNumberTrackIndex(page: number, num: number) {
	const pageOffset = page * QUEUE_PAGE_TRACKS_MAX;
	return pageOffset + num;
}

export function isPlayerUnavailable(targetChannel: BaseGuildVoiceChannel) {
	const playerChannel = targetChannel.guild?.members?.me?.voice?.channel;
	if(!playerChannel) return false;
	return playerChannel.id !== targetChannel.id;
}
