const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { fetchArrows, fetchFlag, fetchUser } = require('../../func');
const { startuptime } = require('../../localdata/config.json'); //Variables globales
const stats = require('../../localdata/stats.json');

module.exports = {
	name: 'info',
	aliases: [
		'informacion', 'información', 'inf',
        'serverinfo', 'svinfo', 'svinf',
		'i'
    ],
    desc: 'Muestra información estadística paginada del servidor',
    flags: [
        'mod'
    ],
    options: [
		'`<canal?>` para mostrar estadísticas extra de un canal',
		'`-m` o `--miembro` para mostrar estadísticas extra de un usuario'
    ],
	callx: '<canal?>',
	
	async execute(message, args) {
		if(!message.guild.available) {
			message.channel.send('El servidor está en corte ahora mismo. Intenta usar el comando más tarde.');
			return;
		}
		message.channel.sendTyping();
		const servidor = message.guild; //Variable que almacena un objeto del servidor a analizar
		const miembro = fetchFlag(args, { property: true, short: ['m'], long: ['miembro'], callback: (x, i) => fetchUser(x[i], message) });
		let selectch;

		//Contadores
		let chs = {
			text: 0, //Canales de texto
			voice: 0, //Canales de voz
			category: 0, //Categorías
			thread: 0, //Hilos
			news: 0, //Canales de noticias
		};

		//Contadores de usuarios
		const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size; //Biológicos
		const botcnt = servidor.memberCount - peoplecnt; //Bots

		//Procesado de información canal-por-canal
		servidor.channels.cache.forEach(channel => {
			console.log(channel.type);
			switch(channel.type) {
			case 'GUILD_NEWS': chs.news++; break;
			case 'GUILD_TEXT': chs.text++; break;
			case 'GUILD_VOICE': chs.voice++; break;
			case 'GUILD_CATEGORY': chs.category++; break;
			case 'GUILD_NEWS_THREAD': chs.thread++; break;
			case 'GUILD_PUBLIC_THREAD': chs.thread++; break;
			case 'GUILD_PRIVATE_THREAD': chs.thread++; break;
			}
		});
		
		if(args.length) {
			if(args[0].startsWith('<#') && args[0].endsWith('>')) {
				args[0] = args[0].slice(2, -1);
				if(args[0].startsWith('!')) args[0] = args[0].slice(1);
			}

			if(isNaN(args[0]))
				selectch = servidor.channels.cache.filter(c => c.messages).find(c => c.name.toLowerCase().indexOf(args[0]) !== -1);
			else 
				selectch = servidor.channels.cache.filter(c => c.messages).find(c => c.id !== -1);
		}

		if(selectch === undefined)
			selectch = message.channel;
		const peocnt = stats[servidor.id][selectch.id]
			? Object.entries(stats[servidor.id][selectch.id].sub)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
			: undefined;
		const msgcnt = Object.entries(stats[servidor.id])
			.sort((a, b) => b[1].cnt - a[1].cnt)
			.slice(0, 5)
			.map(([name, obj]) => [name, obj.cnt]);
		console.log('uwu', peocnt);
		console.log('owo', msgcnt);
			
		//Creacion de top 5
		//Personas más activas
		const peotop = peocnt ? peocnt.map(([name, count]) => `<@${name}>: **${count}** mensajes.`).join('\n') : '_Este canal no tiene mensajes._';
		//Canales más activos
		const chtop = msgcnt.map(([name, count]) => `<#${name}>: **${count}** mensajes.`).join('\n');

		//Crear y usar embed
		let SelectedEmbed = 0;
		const Embed = [];

		const ow = await servidor.fetchOwner();
		Embed[0] = new MessageEmbed()
			.setColor('#ffd500')
			.setTitle('Información del servidor OwO')
			
			.addField('Nombre', servidor.name, true)
			.addField('Dueño', `${ow.user.username}\n[${servidor.ownerId}]`, true)
			.addField('Nivel de verificación', servidor.verificationLevel, true)

			.addField('Canales', `:hash: x ${chs.text}\n:loud_sound: x ${chs.voice}\n:label: x ${chs.category}`, true)
			.addField('• • •', `:speech_left: x ${chs.thread}\n:mega: x ${chs.news}`, true)
			.addField('Usuarios', `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}\n:people_hugging: x ${servidor.memberCount}`, true)

			.addField('Fecha de creación', `<t:${Math.floor(servidor.createdTimestamp / 1000)}:f>`, true)
			.addField('ID', servidor.id, true)
			
			.setImage(servidor.iconURL({ dynamic: true, size: 256 }))
			.setThumbnail(ow.user.avatarURL({ dynamic: true, size: 256 }))
			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL({ dynamic: true, size: 256 }))
			.setFooter(`Estas estadísticas toman información concreta.`);
		
		Embed[1] = new MessageEmbed()
			.setColor('#eebb00')
			.setTitle('Estadísticas de actividad ÛwÕ')

			.addField(`Usuarios más activos (canal: ${selectch.name})`, peotop)
			.addField('Canales más activos', chtop)

			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
			.setFooter(`Estas estadísticas toman información desde el último reinicio del bot hasta la actualidad.`);

		const tiempoguild = Date.now() - servidor.createdAt;
		const serverms = Math.floor(tiempoguild) % 100;
		const serversec = Math.floor(tiempoguild/1000) % 60;
		const servermin = Math.floor(tiempoguild/1000/60) % 60;
		const serverhour = Math.floor(tiempoguild/1000/3600) % 24;
		const serverday = Math.floor(tiempoguild/1000/3600/24) % 30;
		const servermonth = Math.floor(tiempoguild/1000/3600/24/30) % 12;
		const serveryear = Math.floor(tiempoguild/1000/3600/24/365);

		const tiempobot = Date.now() - startuptime;
		const botms = Math.floor(tiempobot) % 100;
		const botsec = Math.floor(tiempobot/1000) % 60;
		const botmin = Math.floor(tiempobot/1000/60) % 60;
		const bothour = Math.floor(tiempobot/1000/3600) % 24;

		Embed[2] = new MessageEmbed()
			.setColor('#e99979')
			.setTitle('Estadísticas de tiempo UwU')

			.addField('Tiempo de vida del servidor', 
				`**${serveryear}** años, **${servermonth}** meses, **${serverday}** días, **${serverhour}**º **${servermin}**' **${serversec}.${serverms}**''`)
			.addField('Tiempo de funcionamiento del bot', 
				`**${bothour}**hs. **${botmin}**min. **${botsec}.${botms}**seg.`)

			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
			.setFooter(`Estas estadísticas toman información concreta.`);
		
		const arrows = fetchArrows(message.client.emojis.cache);
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		message.channel.send({ embeds: [Embed[0]] }).then(sent => {
			sent.react(arrows[0])
				.then(() => sent.react(arrows[1]))
				.then(() => {
					const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
					collector.on('collect', (reaction, ruser) => {
						const maxpage = 2;
						if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0) ? (SelectedEmbed - 1) : maxpage;
						else SelectedEmbed = (SelectedEmbed < maxpage) ? (SelectedEmbed + 1) : 0;
						sent.edit({ embeds: [Embed[SelectedEmbed]] });
						reaction.users.remove(ruser);
					});
				});
		});
    },
};