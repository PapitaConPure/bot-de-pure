const { EmbedBuilder, ChannelType, User, GuildMember } = require('discord.js'); //Integrar discord.js
const { fetchArrows, fetchUser, improveNumber, isShortenedNumberString, fetchMember } = require('../../func');
const globalConfigs = require('../../localdata/config.json'); //Variables globales
const { ChannelStats, Stats } = require('../../localdata/models/stats');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');
const { CommandPermissions } = require('../Commons/cmdPerms');

/**@param {Number} number*/
const counterDisplay = (number) => {
    const numberString = improveNumber(number, true);
    if(isShortenedNumberString(numberString))
        return `${numberString} de`;
    return numberString;
}

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
	.setExperimentalExecution(async (request, args) => {
		if(!request.guild.available)
			return request.reply(':interrobang: E-el servidor está en corte ahora mismo. Intenta usar el comando más tarde');

		const [stats] = await Promise.all([
			globalConfigs.noDataBase ? new Stats({ since: Date.now() }) : Stats.findOne({}),
			request.deferReply(),
		]);
		const servidor = request.guild;
		const miembro = args.parseFlagExpr('miembro', (/** @type {string | GuildMember} */ f) => fetchMember(f, request));

		//Contadores de usuarios
		const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size;
		const botcnt = servidor.memberCount - peoplecnt;

		let channelCounts = {
			text: 0,
			voice: 0,
			category: 0,
			thread: 0,
			news: 0,
		};
		
		servidor.channels.cache.forEach(channel => {
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
		
		//Análisis de actividad
		args.ensureRequistified();
		let targetChannel = args.getChannel('canal') || request.channel;

		const channelQuery = {
			guildId: servidor.id,
			channelId: targetChannel.id,
		};
		const channelStats = (!globalConfigs.noDataBase && await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery);
		
		const peocnt = Object.keys(channelStats.sub).length
			? Object.entries(channelStats.sub)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
			: undefined;
		const msgcnt = Object.values(!globalConfigs.noDataBase ? new ChannelStats(channelQuery) : await ChannelStats.find({ guildId: servidor.id }))
			.sort((a, b) => b.cnt - a.cnt)
			.slice(0, 5)
			.map((obj) => /**@type {[String, Number]}*/([obj.channelId, obj.cnt]));
			
		//Creacion de tops 5
		const peotop = peocnt ? peocnt.map(([id, count]) => `<@${id}>: **${counterDisplay(count)}** mensajes`).join('\n') : '_Este canal no tiene mensajes_';
		const chtop = msgcnt.map(([id, count]) => `<#${id}>: **${counterDisplay(count)}** mensajes`).join('\n');

		const pages = [];
		const owner = await servidor.fetchOwner();
		const author = request.user;
		pages.push(
			new EmbedBuilder()
				.setColor(0xffd500)
				.setTitle('Información del servidor')
				.setImage(servidor.iconURL({ size: 256 }))
				.setThumbnail(owner.user.avatarURL({ size: 256 }))
				.setAuthor({ name: `Comando invocado por ${author.username}`, iconURL: author.avatarURL({ size: 256 }) })
				.setFooter({ text: `Estas estadísticas toman información concreta.` })
				.addFields(
					{ name: 'Nombre', 				 value: servidor.name, 														  					   inline: true },
					{ name: 'Dueño', 				 value: `${owner.user.username}\n\`${servidor.ownerId}\``, 					  					   inline: true },
					{ name: 'Nivel de verificación', value: `Nivel ${servidor.verificationLevel}`, 										  					   inline: true },

					{ name: 'Canales', 				 value: `#️⃣ x ${channelCounts.text}\n🔊 x ${channelCounts.voice}\n🏷 x ${channelCounts.category}`, inline: true },
					{ name: '• • •', 				 value: `🗨️ x ${channelCounts.thread}\n📣 x ${channelCounts.news}`, 							    inline: true },
					{ name: 'Usuarios', 			 value: `🧑‍🦲 x ${peoplecnt}\n🤖 x ${botcnt}\n👥 x ${servidor.memberCount}`, 					   inline: true },

					{ name: 'Fecha de creación', 	 value: `<t:${Math.floor(servidor.createdTimestamp / 1000)}:f>`, 			  					   inline: true },
					{ name: 'ID', 					 value: servidor.id, 														  					   inline: true },
				),
		);
		
		const dbStart = new Date(stats.since).toLocaleString('es-ES');
		pages.push(
			new EmbedBuilder()
			.setColor(0xeebb00)
				.setTitle('Estadísticas de actividad')
				.setAuthor({ name: `Comando invocado por ${author.username}`, iconURL: author.avatarURL() })
				.setFooter({ text: `Estas estadísticas toman información desde el ${dbStart.slice(0, dbStart.indexOf(' '))}` })
				.addFields(
					{ name: `Usuarios más activos (canal: ${targetChannel.name})`, value: peotop },
					{ name: 'Canales más activos', value: chtop },
				),
		);

		pages.push(
			new EmbedBuilder()
				.setColor(0xe99979)
				.setTitle('Estadísticas de tiempo')
				.addFields(
					{
						name: 'Tiempo de vida del servidor', 
						value: `<t:${Math.round(+servidor.createdAt / 1000)}:R>`,
					},
					{
						name: 'Tiempo de funcionamiento del bot', 
						value: `<t:${Math.round(+globalConfigs.startupTime / 1000)}:R>`,
					},
				),
		);
		
		const replyContent = { embeds: [pages[0]] };
		/**@type {import('discord.js').Message}*/
		const sent = await request.editReply(replyContent);
		const arrows = fetchArrows(request.client.emojis.cache);
		await sent.react(/**@type {import('discord.js').EmojiIdentifierResolvable}*/(arrows[0]));
		await sent.react(/**@type {import('discord.js').EmojiIdentifierResolvable}*/(arrows[1]));

		let selectedPage = 0;
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
		collector.on('collect', (reaction, ruser) => {
			const maxpage = 2;
			if(reaction.emoji.id === arrows[0].id) selectedPage = (selectedPage > 0) ? (selectedPage - 1) : maxpage;
			else selectedPage = (selectedPage < maxpage) ? (selectedPage + 1) : 0;
			sent.edit({ embeds: [pages[selectedPage]] });
			reaction.users.remove(ruser);
		});
	});

module.exports = command;