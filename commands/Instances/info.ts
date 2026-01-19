import { ChannelType, ButtonBuilder, ButtonStyle, MessageFlags, ContainerBuilder, SectionBuilder } from 'discord.js';
import { fetchMember, compressId, shortenText, quantityDisplay } from '../../func';
import { ChannelStats, Stats } from '../../models/stats';
import { CommandOptions, CommandTags, Command } from '../Commons/';
import { makeButtonRowBuilder } from '../../utils/tsCasts';
import { Translator } from '../../i18n';
import { fetchGuildMembers } from '../../utils/guildratekeeper';
import { getUnixTime } from 'date-fns';
import { globalConfigs, noDataBase } from '../../data/globalProps';

/**
 * @param {String} requestId
 * @param {Number} pageCount
 * @param {Number?} page
 */
const getPaginationControls = (page, pageCount, requestId) => {
	const firstPage = 0;
	const lastPage = pageCount - 1;
	const prevPage = page > firstPage ? (page - 1) : lastPage;
	const nextPage = page < lastPage ? (page + 1) : firstPage;
	return makeButtonRowBuilder().addComponents([
		new ButtonBuilder()
			.setCustomId(`info_navigate_${prevPage}_${requestId}_PV`)
			.setEmoji('934430008343158844')
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`info_navigate_${nextPage}_${requestId}_NX`)
			.setEmoji('934430008250871818')
			.setStyle(ButtonStyle.Secondary),
	]);
};

const options = new CommandOptions()
	.addParam('canal', 'CHANNEL', 'para mostrar estadísticas extra de un canal', { optional: true })
	.addFlag('m', 'miembro', 'para mostrar estadísticas extra de un usuario (no implementado)', { name: 'objetivo', type: 'MEMBER' });

const tags = new CommandTags().add('COMMON');

const command = new Command('info', tags)
	.setAliases(
		'informacion', 'información', 'inf',
		'serverinfo', 'svinfo', 'svinf',
		'i',
	)
	.setLongDescription('Muestra información estadística paginada del servidor')
	.setOptions(options)
	.setExecution(async (request, args) => {
		if(!request.guild.available)
			return request.reply({ content: '⁉️' });

		const guild = request.guild;
		const [ stats, translator ] = await Promise.all([
			noDataBase ? new Stats({ since: Date.now() }) : Stats.findOne({}),
			Translator.from(request),
			request.deferReply(),
			fetchGuildMembers(guild),
		]);
		const memberResult = args.parseFlagExpr('miembro');
		const targetMember = memberResult ? fetchMember(memberResult, request) : undefined;
		const targetChannel = args.getChannel('canal') || request.channel;

		const pages = /**@type {ContainerBuilder[]}*/([]);

		//Página principal
		const mainCointainer = new ContainerBuilder()
			.setAccentColor(0xffd500);

		const humanCount = guild.members.cache.filter(member => !member.user.bot).size;
		const botCount = guild.memberCount - humanCount;

		const channelCounts = {
			text: 0,
			voice: 0,
			category: 0,
			thread: 0,
			news: 0,
		};

		guild.channels.cache.forEach(channel => {
			switch(channel.type) {
			case ChannelType.GuildAnnouncement:  channelCounts.news++;     break;
			case ChannelType.GuildForum:         channelCounts.text++;     break;
			case ChannelType.GuildText:          channelCounts.text++;     break;
			case ChannelType.GuildVoice:         channelCounts.voice++;    break;
			case ChannelType.GuildStageVoice:    channelCounts.voice++;    break;
			case ChannelType.GuildCategory:      channelCounts.category++; break;
			case ChannelType.AnnouncementThread: channelCounts.thread++;   break;
			case ChannelType.PublicThread:       channelCounts.thread++;   break;
			case ChannelType.PrivateThread:      channelCounts.thread++;   break;
			}
		});

		const bannerURL = guild.bannerURL({ size: 4096 });
		if(bannerURL)
			mainCointainer.addMediaGalleryComponents(mediaGallery =>
				mediaGallery.addItems(
					mgItem => mgItem
						.setDescription(translator.getText('infoGuildBannerAlt'))
						.setURL(bannerURL),
				)
			);

		const owner = await guild.fetchOwner();
		const guildIsDiscoverable = guild.features.includes('DISCOVERABLE');
		const guildCreatedAtUnix = Math.floor(getUnixTime(guild.createdAt));

		mainCointainer
			.addSectionComponents(section =>
				section
					.addTextDisplayComponents(
						textDisplay => textDisplay.setContent(translator.getText('infoGuildEpigraph', guildIsDiscoverable)),
						textDisplay => textDisplay.setContent(`# ${shortenText(guild.name, 100, '…')}`),
						textDisplay => textDisplay.setContent([
							translator.getText('infoGuildCreatedAt', guildCreatedAtUnix),
							`🆔 \`${guild.id}\``,
						].join('\n')),
					)
					.setThumbnailAccessory(accessory =>
						accessory
							.setDescription(translator.getText('infoGuildIconAlt'))
							.setURL(guild.iconURL({ size: 256 }))
					)
			)
			.addSeparatorComponents(separator => separator.setDivider(true))
			.addSectionComponents(section =>
				section
					.setThumbnailAccessory(accessory =>
						accessory
							.setDescription(translator.getText('infoGuildOwnerAvatarAlt'))
							.setURL(owner.displayAvatarURL({ size: 256 }))
					)
					.addTextDisplayComponents(
						textDisplay => textDisplay.setContent(translator.getText('infoGuildOwnerEpigraph')),
						textDisplay => textDisplay.setContent(`## ${owner.displayName}`),
						textDisplay => textDisplay.setContent([
							`👤 ${owner}`,
							`🆔 \`${owner.id}\``,
						].join('\n')),
					)
			)
			.addSeparatorComponents(separator => separator.setDivider(true))
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(translator.getText('infoGuildBasicInfoTitle'))
			)
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(
					translator.getText('infoGuildMemberCount', humanCount, botCount, guild.memberCount)
				)
			)
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(
					translator.getText('infoGuildChannelCount',
						channelCounts.text, channelCounts.voice, channelCounts.news,
						channelCounts.category, channelCounts.thread,
					)
				)
			)
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent(
					translator.getText('infoGuildSecurity', guild.verificationLevel, guild.mfaLevel)
				)
			);

		pages.push(mainCointainer);


		//Página de estadísticas de actividad
		const activityStatsContainer = new ContainerBuilder()
			.setAccentColor(0xeebb00);

		const channelQuery = {
			guildId: guild.id,
			channelId: targetChannel.id,
		};
		const targetChannelStats = /**@type {import('../../models/stats.js').ChannelStatsDocument}*/((!noDataBase && await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery));
		const guildChannelStats = /**@type {import('../../models/stats.js').ChannelStatsDocument[]}*/(!noDataBase ? await ChannelStats.find({ guildId: guild.id }) : [ new ChannelStats(channelQuery) ]);
		const targetChannelHasMessages = Object.keys(targetChannelStats.sub).length;

		const membersRanking = targetChannelHasMessages
			? Object.entries(targetChannelStats.sub)
				.sort((a: [string, number], b: [string, number]) => b[1] - a[1])
				.slice(0, 5)
			: undefined;

		const formattedMembersRanking = membersRanking
			? membersRanking
				.map(([ id, count ]: [string, number]) => `${translator.getText('infoStatsMemberMessageCountItem', id, quantityDisplay(count, translator))}`)
				.join('\n')
			: translator.getText('infoStatsChannelEmptyNotice');

		const channelsRanking = Object.values(guildChannelStats)
			.sort((a, b) => b.cnt - a.cnt)
			.slice(0, 5)
			.map(channelStats => /**@type {[String, Number]}*/([ channelStats.channelId, channelStats.cnt ]));
		const formattedChannelsRanking =
			channelsRanking
				.map(([ id, count ]: [string, number]) => `${translator.getText('infoStatsChannelMessageCountItem', id, quantityDisplay(count, translator))}`)
				.join('\n');

		const statsSinceUnix = getUnixTime(new Date(stats.since));

		activityStatsContainer
			.addTextDisplayComponents(
				textDisplay => textDisplay.setContent(translator.getText('infoStatsTitle')),
				textDisplay => textDisplay.setContent(`${translator.getText('infoStatsTopMembersSubtitle', `${targetChannel}`)}\n${formattedMembersRanking}`),
				textDisplay => textDisplay.setContent(`${translator.getText('infoStatsTopChannelsSubtitle')}\n${formattedChannelsRanking}`)
			);

		if(targetMember) {
			const memberSectionBuilder = new SectionBuilder()
				.setThumbnailAccessory(accessory =>
					accessory
						.setDescription(translator.getText('infoTargetMemberAvatarAlt', targetMember.displayName))
						.setURL(targetMember.displayAvatarURL())
				);
			activityStatsContainer
				.addSeparatorComponents(separator => separator.setDivider(true))
				.addSectionComponents(memberSectionBuilder);

			const memberId = targetMember.id;
			const channelAndMemberMessageCountPairs = Object.values(guildChannelStats)
				.filter(channelStats => channelStats.sub[memberId])
				.map(channelStats => /**@type {const}*/([ channelStats.channelId, /**@type {number}*/(channelStats.sub[memberId]) ]));

			if(channelAndMemberMessageCountPairs.length) {
				const memberActivitySum = channelAndMemberMessageCountPairs
					.map(memberChannelMessageCount => memberChannelMessageCount[1])
					.reduce((a, b) => a + b, 0);
				const formattedMemberActivitySum = translator.getText('infoStatsTargetMemberTotalMessageSum', targetMember, quantityDisplay(memberActivitySum, translator), guild);

				const memberChannelsRanking = channelAndMemberMessageCountPairs
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5);
				const formattedMemberChannelsRanking =
					memberChannelsRanking
						.map(([ id, count ]) => translator.getText('infoStatsChannelMessageCountItem', id, quantityDisplay(count, translator)))
						.join('\n');

				memberSectionBuilder.addTextDisplayComponents(
					textDisplay => textDisplay.setContent(
						`${translator.getText('infoStatsTargetMemberTitle', targetMember.displayName)}\n${formattedMemberActivitySum}\n­ ­`
					),
					textDisplay => textDisplay.setContent(
						`${translator.getText('infoStatsTargetMemberTopChannelsSubtitle')}\n${formattedMemberChannelsRanking}`
					),
				);
			} else {
				memberSectionBuilder.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent([
						translator.getText('infoStatsTargetMemberTitle', targetMember.displayName),
						translator.getText('infoStatsTargetMemberNoDataNotice', `${targetMember}`),
					].join('\n'))
				);
			}
		}

		activityStatsContainer.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(translator.getText('infoStatsSinceFooter', statsSinceUnix)),
		);

		pages.push(activityStatsContainer);


		//Página de estadísticas de tiempo
		const timeStatsContainer = new ContainerBuilder()
			.setAccentColor(0xe99979);

		const botLastResetUnix = getUnixTime(new Date(globalConfigs.startupTime));

		timeStatsContainer
			.addTextDisplayComponents(
				textDisplay => textDisplay.setContent('## Estadísticas de tiempo'),
				textDisplay => textDisplay.setContent([
					translator.getText('infoTimeGuildCreatedAt', guildCreatedAtUnix),
					translator.getText('infoTimeBotLastResetAt', botLastResetUnix),
				].join('\n')),
			);

		pages.push(timeStatsContainer);


		//Finalizar páginas y responder
		const requestId = compressId(request.id);
		pages.forEach((page, pageNumber) =>
			page
				.addSeparatorComponents(separator => separator.setDivider(true))
				.addActionRowComponents(getPaginationControls(pageNumber, pages.length, requestId))
		);
		command.memory.set(requestId, pages);

		return request.editReply({
			flags: MessageFlags.IsComponentsV2,
			components: [ mainCointainer ],
			allowedMentions: {},
		});
	})
	.setButtonResponse(async function navigate(interaction, page, requestId) {
		const translator = await Translator.from(interaction.user);

		const pageNumber = +page;
		const pages = command.memory.get(requestId);

		if(!pages)
			return interaction.reply({ content: translator.getText('expiredWizardData'), flags: MessageFlags.Ephemeral });

		return interaction.update({
			flags: MessageFlags.IsComponentsV2,
			components: [ pages[pageNumber] ],
		});
	});

export default command;
