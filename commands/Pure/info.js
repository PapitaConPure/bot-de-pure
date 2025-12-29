const { ChannelType, ButtonBuilder, ButtonStyle, MessageFlags, ContainerBuilder, SectionBuilder } = require('discord.js'); //Integrar discord.js
const { improveNumber, isShortenedNumberString, fetchMember, compressId, shortenText } = require('../../func');
const globalConfigs = require('../../localdata/config.json'); //Variables globales
const { ChannelStats, Stats } = require('../../localdata/models/stats');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');
const { makeButtonRowBuilder } = require('../../tsCasts');
const { Translator } = require('../../internationalization');

/**@param {Number} number*/
const counterDisplay = (number) => {
    const numberString = improveNumber(number, true);
    if(isShortenedNumberString(numberString))
        return `${numberString} de`;
    return numberString;
}

/**
 * @param {String} requestId
 * @param {Number} pageCount
 * @param {Number?} page 
 */
const getPaginationControls = (page, pageCount, requestId) => {
	const firstPage = 0;
	const lastPage = pageCount - 1;
	const prevPage = page > firstPage ? (page - 1) : lastPage
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
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('info', flags)
	.setAliases(
		'informacion', 'información', 'inf',
        'serverinfo', 'svinfo', 'svinf',
		'i',
	)
	.setLongDescription('Muestra información estadística paginada del servidor')
	.setOptions(options)
	.setExecution(async (request, args) => {
		if(!request.guild.available)
			return request.reply('⁉️');

		const [stats, translator] = await Promise.all([
			globalConfigs.noDataBase ? new Stats({ since: Date.now() }) : Stats.findOne({}),
			Translator.from(request),
			request.deferReply(),
		]);
		const guild = request.guild;
		const memberResult = /**@type {string | import('discord.js').GuildMember}*/(args.parseFlagExpr('miembro'));
		const member = memberResult ? await fetchMember(memberResult, request) : undefined;

		const pages = /**@type {ContainerBuilder[]}*/([]);

		//Página principal
		const mainCointainer = new ContainerBuilder()
			.setAccentColor(0xffd500);

		const humanCount = guild.members.cache.filter(member => !member.user.bot).size;
		const botCount = guild.memberCount - humanCount;

		let channelCounts = {
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
		
		const owner = await guild.fetchOwner();
		const guildIsDiscoverable = guild.features.includes('DISCOVERABLE');
		const bannerURL = guild.bannerURL();
		if(bannerURL)
			mainCointainer.addMediaGalleryComponents(mediaGallery =>
				mediaGallery.addItems(
					mgItem => mgItem
						.setDescription('Portada del servidor')
						.setURL(bannerURL),
				)
			)

		mainCointainer
			.addSectionComponents(section =>
				section
					.addTextDisplayComponents(
						textDisplay => textDisplay.setContent(`-# Servidor ${guildIsDiscoverable ? 'público' : 'privado'}`),
						textDisplay => textDisplay.setContent(`# ${shortenText(guild.name, 100, '…')}`),
						textDisplay => textDisplay.setContent([
							`🗓️ Creado en <t:${Math.floor(guild.createdTimestamp / 1000)}:f>`,
							`🆔 \`${guild.id}\``,
						].join('\n')),
					)
					.setThumbnailAccessory(accessory =>
						accessory
							.setDescription('Ícono del servidor')
							.setURL(guild.iconURL({ size: 256 }))
					)
			)
			.addSeparatorComponents(separator => separator.setDivider(true))
			.addSectionComponents(section =>
				section
					.setThumbnailAccessory(accessory =>
						accessory
							.setDescription('Avatar del dueño del servidor')
							.setURL(owner.displayAvatarURL({ size: 256 }))
					)
					.addTextDisplayComponents(
						textDisplay => textDisplay.setContent('-# Dueño del servidor'),
						textDisplay => textDisplay.setContent(`## ${owner.displayName}`),
						textDisplay => textDisplay.setContent([
							`👤 ${owner}`,
							`🆔 \`${owner.id}\``,
						].join('\n')),
					)
			)
			.addSeparatorComponents(separator => separator.setDivider(true))
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent('## Información')
			)
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent([
					'### Usuarios',
					`🧑‍🦲 **${humanCount}** humanos (aproximado)`,
					`🤖 **${botCount}** bots (aproximado)`,
					`👥 **${guild.memberCount}** miembros totales`,
				].join('\n')),
			)
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent([
					'### Canales',
					`#️⃣ **${channelCounts.text}** canales de texto`,
					`🔊 **${channelCounts.voice}** canales de voz`,
					`📣 **${channelCounts.news}** canales de noticias`,
					`🏷️ **${channelCounts.category}** categorías`,
					`🧵 **${channelCounts.thread}** hilos`,
				].join('\n')),
			)
			.addTextDisplayComponents(textDisplay =>
				textDisplay.setContent([
					'### Seguridad',
					`Verificación Nivel **${guild.verificationLevel}**`,
					`MFA Nivel **${guild.mfaLevel}**`,
				].join('\n')),
			)

		pages.push(mainCointainer);
		
		
		//Página de estadísticas de actividad
		const activityStatsContainer = new ContainerBuilder()
			.setAccentColor(0xeebb00);

		args.ensureRequistified();
		let targetChannel = args.getChannel('canal') || request.channel;

		const channelQuery = {
			guildId: guild.id,
			channelId: targetChannel.id,
		};
		const targetChannelStats = /**@type {import('../../localdata/models/stats.js').ChannelStatsDocument}*/((!globalConfigs.noDataBase && await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery));
		const guildChannelStats = /**@type {import('../../localdata/models/stats.js').ChannelStatsDocument[]}*/(!globalConfigs.noDataBase ? await ChannelStats.find({ guildId: guild.id }) : [new ChannelStats(channelQuery)]);
		const targetChannelHasMessages = Object.keys(targetChannelStats.sub).length;
		
		const membersRanking = targetChannelHasMessages
			? Object.entries(targetChannelStats.sub)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
			: undefined;
		
		const formattedMembersRanking = membersRanking ? membersRanking.map(([id, count]) => `<@${id}>: **${counterDisplay(count)}** mensajes`).join('\n') : '_Este canal no tiene mensajes_';
		
		const channelsRanking = Object.values(guildChannelStats)
			.sort((a, b) => b.cnt - a.cnt)
			.slice(0, 5)
			.map(channelStats => /**@type {[String, Number]}*/([channelStats.channelId, channelStats.cnt]));
		const formattedChannelsRanking = channelsRanking.map(([id, count]) => `<#${id}>: **${counterDisplay(count)}** mensajes`).join('\n');

		const statsSinceDateString = new Date(stats.since)
			.toLocaleString('es-419', { year: 'numeric', month: '2-digit', day: '2-digit' });

		activityStatsContainer
			.addTextDisplayComponents(
				textDisplay => textDisplay.setContent('## Estadísticas de actividad'),
				textDisplay => textDisplay.setContent(`### Usuarios más activos (canal: ${targetChannel})\n${formattedMembersRanking}`),
				textDisplay => textDisplay.setContent(`### Canales más activos\n${formattedChannelsRanking}`)
			);

		if(member) {
			const memberSectionBuilder = new SectionBuilder()
				.setThumbnailAccessory(accessory =>
					accessory
						.setDescription(`Avatar de ${member.displayName || member.user.username}`)
						.setURL(member.displayAvatarURL())
				);
			activityStatsContainer
				.addSeparatorComponents(separator => separator.setDivider(true))
				.addSectionComponents(memberSectionBuilder);

			const memberId = member.id;
			const channelAndMemberMessageCountPairs = Object.values(guildChannelStats)
				.filter(channelStats => channelStats.sub[memberId])
				.map(channelStats => /**@type {const}*/([ channelStats.channelId, /**@type {number}*/(channelStats.sub[memberId]) ]));

			if(channelAndMemberMessageCountPairs.length) {
				const memberActivitySum = channelAndMemberMessageCountPairs
					.map(memberChannelMessageCount => memberChannelMessageCount[1])
					.reduce((a, b) => a + b, 0);
				const formattedMemberActivitySum = `${member} envió un total de **${memberActivitySum}** mensajes en *${guild}*`;

				const memberChannelsRanking = channelAndMemberMessageCountPairs
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5);
				const formattedMemberChannelsRanking = memberChannelsRanking.map(([id, count]) => `<#${id}>: **${counterDisplay(count)}** mensajes`).join('\n');
	
				memberSectionBuilder.addTextDisplayComponents(
					textDisplay => textDisplay.setContent(`## Actividad de ${member.displayName}\n${formattedMemberActivitySum}\n­ ­`),
					textDisplay => textDisplay.setContent(`### Su mayor participación\n${formattedMemberChannelsRanking}`),
				);
			} else {
				memberSectionBuilder.addTextDisplayComponents(textDisplay =>
					textDisplay.setContent(`## Actividad de ${member.displayName}\n_No hay actividad de ${member} para mostrar._`)
				);
			}
		}

		activityStatsContainer.addTextDisplayComponents(textDisplay =>
			textDisplay.setContent(`-# Estas estadísticas toman información desde el ${statsSinceDateString}`),
		);

		pages.push(activityStatsContainer);


		//Página de estadísticas de tiempo
		const timeStatsContainer = new ContainerBuilder()
			.setAccentColor(0xe99979);

		timeStatsContainer
			.addTextDisplayComponents(
				textDisplay => textDisplay.setContent('## Estadísticas de tiempo'),
				textDisplay => textDisplay.setContent([
					`🗓️ El servidor se creó <t:${Math.round(+guild.createdAt / 1000)}:R>`,
					`🕰️ Me reinicié por última vez <t:${Math.round(+globalConfigs.startupTime / 1000)}:R>`,
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
			components: [mainCointainer],
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
			components: [pages[pageNumber]],
		});
	});

module.exports = command;
