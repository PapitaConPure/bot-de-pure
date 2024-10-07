const { EmbedBuilder, ChannelType, User } = require('discord.js'); //Integrar discord.js
const { fetchArrows, fetchUser, improveNumber, isShortenedNumberString } = require('../../func');
const global = require('../../localdata/config.json'); //Variables globales
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
	.addFlag('m', 'miembro', 'para mostrar estadísticas extra de un usuario');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('info', flags)
	.setAliases(
		'informacion', 'información', 'inf',
        'serverinfo', 'svinfo', 'svinf',
		'i',
	)
	.setLongDescription('Muestra información estadística paginada del servidor')
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		if(!request.guild.available)
			return request.reply(':interrobang: E-el servidor está en corte ahora mismo. Intenta usar el comando más tarde');

		const [stats] = await Promise.all([
			Stats.findOne({}),
			request.deferReply(),
		]);
		const servidor = request.guild; //Variable que almacena un objeto del servidor a analizar
		const miembro = options.fetchFlag(args, 'miembro', { callback: (/** @type {string | User} */ f) => fetchUser(f, { client: request.client, guild: request.guild }) });

		//Contadores de usuarios
		const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size; //Biológicos
		const botcnt = servidor.memberCount - peoplecnt; //Bots

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
		const textChannelsCache = servidor.channels.cache.filter(c => c.type === ChannelType.GuildText);
		let targetChannel;
		if(isSlash) 
			targetChannel = args.getChannel('canal');
		else if(args.length) {
			let search = args[0];
			if(search.startsWith('<#') && search.endsWith('>')) {
				search = search.slice(2, -1);
				if(search.startsWith('!')) search = search.slice(1);
			}
			targetChannel = isNaN(search)
				? textChannelsCache.find(c => c.name.toLowerCase().includes(search))
				: textChannelsCache.get(search);
		}

		targetChannel ||= request.channel;

		const channelQuery = {
			guildId: servidor.id,
			channelId: targetChannel.id,
		};
		const channelStats = (await ChannelStats.findOne(channelQuery)) || new ChannelStats(channelQuery);
		
		const peocnt = Object.keys(channelStats.sub).length
			? Object.entries(channelStats.sub)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
			: undefined;
		const msgcnt = Object.values(await ChannelStats.find({ guildId: servidor.id }))
			.sort((a, b) => b.cnt - a.cnt)
			.slice(0, 5)
			.map((obj) => [obj.channelId, obj.cnt]);
			
		//Creacion de tops 5
		const peotop = peocnt ? peocnt.map(([id, count]) => `<@${id}>: **${counterDisplay(count)}** mensajes`).join('\n') : '_Este canal no tiene mensajes_';
		const chtop = msgcnt.map(([id, count]) => `<#${id}>: **${counterDisplay(count)}** mensajes`).join('\n');

		const pages = [];
		const owner = await servidor.fetchOwner();
		const author = request.author ?? request.user;
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

		const tiempoguild = Date.now() - (+servidor.createdAt);
		const serverms = Math.floor(tiempoguild) % 100;
		const serversec = Math.floor(tiempoguild / 1000) % 60;
		const servermin = Math.floor(tiempoguild / 1000 / 60) % 60;
		const serverhour = Math.floor(tiempoguild / 1000 / 3600) % 24;
		const serverday = Math.floor(tiempoguild / 1000 / 3600 / 24) % 30;
		const servermonth = Math.floor(tiempoguild / 1000 / 3600 / 24 / 30) % 12;
		const serveryear = Math.floor(tiempoguild / 1000 / 3600 / 24 / 365);

		const tiempobot = Date.now() - global.startupTime;
		const botms = Math.floor(tiempobot) % 100;
		const botsec = Math.floor(tiempobot / 1000) % 60;
		const botmin = Math.floor(tiempobot / 1000 / 60) % 60;
		const bothour = Math.floor(tiempobot / 1000 / 3600) % 24;

		pages.push(
			new EmbedBuilder()
				.setColor(0xe99979)
				.setTitle('Estadísticas de tiempo')
				.addFields(
					{
						name: 'Tiempo de vida del servidor', 
						value: `**${serveryear}** años, **${servermonth}** meses, **${serverday}** días, **${serverhour}**º **${servermin}**' **${serversec}.${serverms}**''`,
					},
					{
						name: 'Tiempo de funcionamiento del bot', 
						value: `**${bothour}**hs. **${botmin}**min. **${botsec}.${botms}**seg.`,
					},
				),
		);
		
		const replyContent = { embeds: [pages[0]] };
		/**@type {import('discord.js').Message}*/
		const sent = await request.editReply(replyContent);
		const arrows = fetchArrows(request.client.emojis.cache);
		await sent.react(arrows[0]);
		await sent.react(arrows[1]);

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