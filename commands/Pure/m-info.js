const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const stats = require('../../localdata/stats.json');

module.exports = {
	name: 'm-info',
	aliases: [
		'm-informacion', 'm-información', 'm-inf',
        'm-serverinfo', 'm-svinfo', 'm-svinf',
		'm-i'
    ],
    desc: 'Muestra información estadística paginada del servidor',
    flags: [
        'mod'
    ],
    options: [
		'`<canal?>` para mostrar estadísticas extra de un canal'
    ],
	callx: '<canal?>',
	
	execute(message, args) {
		message.channel.startTyping();
		const servidor = message.channel.guild; //Variable que almacena un objeto del servidor a analizar
		let selectch;

		//Contadores
		let textcnt = 0; //Canales de texto
		let voicecnt = 0; //Canales de voz
		let categorycnt = 0; //Categorías

		//Contadores de usuarios
		const peoplecnt = servidor.members.cache.filter(member => !member.user.bot).size; //Biológicos
		const botcnt = servidor.memberCount - peoplecnt; //Bots

		//Procesado de información canal-por-canal
		servidor.channels.cache.forEach(channel => {
			if(channel.type === 'text') textcnt++;
			else if(channel.type === 'voice') voicecnt++;
			else if(channel.type === 'category') categorycnt++;
		});
		
		if(args.length) {
			if(args[0].startsWith('<#') && args[0].endsWith('>')) {
				args[0] = args[0].slice(2, -1);
				if(args[0].startsWith('!')) args[0] = args[0].slice(1);
			}

			if(isNaN(args[0])) {
				message.guild.channels.cache.map(chnm => {
					if(chnm.name.toLowerCase().indexOf(args[0]) !== -1)
						selectch = chnm;
				});
			} else {
				message.guild.channels.cache.map(chnb => {
					if(chnb.id === args[0])
						selectch = chnb;
				});
			}
		}

		if((typeof selectch) === 'undefined')
			selectch = message.channel;
		const peocnt = Object.entries(stats[servidor.id][selectch.id].sub)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
		const msgcnt = Object.entries(stats[servidor.id])
			.sort((a, b) => b[1].cnt - a[1].cnt)
			.slice(0, 5)
			.map(([name, obj]) => [name, obj.cnt]);
		console.log('uwu', peocnt);
		console.log('owo', msgcnt);

		//Ordenamiento burbuja
		/*for(let i = 1; i < textcnt; i++)
			for(let j = 0; j < (textcnt - i); j++)
				if(msgcnt[j] < msgcnt[j + 1]) {
					//Contador de mensajes "cantidad"
					let tmp = msgcnt[j];
					msgcnt[j] = msgcnt[j + 1];
					msgcnt[j + 1] = tmp;
					//Contador de mensajes "id"
					tmp = chid[j];
					chid[j] = chid[j + 1];
					chid[j + 1] = tmp;
				}

		for(let i = 1; i < peoid.length; i++)
			for(let j = 0; j < (peoid.length - i); j++)
				if(peocnt[j] < peocnt[j + 1]) {
					//Contador de personas "cantidad"
					tmp = peocnt[j];
					peocnt[j] = peocnt[j + 1];
					peocnt[j + 1] = tmp;
					//Contador de personas "id"
					tmp = peoid[j];
					peoid[j] = peoid[j + 1];
					peoid[j + 1] = tmp;
				}*/
			
		//Creacion de top 5
		//Personas más activas
		const peotop = peocnt.map(([name, count]) => `<@${name}>: **${count}** mensajes.`).join('\n');
		//Canales más activos
		const chtop = msgcnt.map(([name, count]) => `<#${name}>: **${count}** mensajes.`).join('\n');

		//Crear y usar embed
		let SelectedEmbed = 0;
		const Embed = [];

		Embed[0] = new Discord.MessageEmbed()
			.setColor('#ffd500')
			.setTitle('Información del servidor OwO')

			.addField('Nombre', servidor.name, true)
			.addField('Usuarios', `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}\n:people_hugging: x ${servidor.memberCount}`, true)
			.addField('Canales', `:hash: x ${textcnt}\n:loud_sound: x ${voicecnt}\n:label: x ${categorycnt}`, true)

			.addField('Región', servidor.region, true)
			.addField('Creador', `${servidor.owner.user.username}\n[${servidor.owner.id}]`, true)
			.addField('Nivel de verificación', servidor.verificationLevel, true)

			.addField('Fecha de creación', servidor.createdAt, true)
			.addField('ID', servidor.id, true)

			.setImage(servidor.iconURL({ dynamic: true, size: 256 }))
			.setThumbnail(servidor.owner.user.avatarURL({ dynamic: true, size: 256 }))
			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL({ dynamic: true, size: 256 }))
			.setFooter(`Estas estadísticas toman información concreta.`);

		Embed[1] = new Discord.MessageEmbed()
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

		const tiempobot = Date.now() - global.startuptime;
		const botms = Math.floor(tiempobot) % 100;
		const botsec = Math.floor(tiempobot/1000) % 60;
		const botmin = Math.floor(tiempobot/1000/60) % 60;
		const bothour = Math.floor(tiempobot/1000/3600) % 24;

		Embed[2] = new Discord.MessageEmbed()
			.setColor('#e99979')
			.setTitle('Estadísticas de tiempo UwU')

			.addField('Tiempo de vida del servidor', 
				`**${serveryear}** años, **${servermonth}** meses, **${serverday}** días, **${serverhour}**º **${servermin}**' **${serversec}.${serverms}**''`)
			.addField('Tiempo de funcionamiento del bot', 
				`**${bothour}**hs. **${botmin}**min. **${botsec}.${botms}**seg.`)

			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
			.setFooter(`Estas estadísticas toman información concreta.`);
		
		const arrows = [message.client.emojis.cache.get('681963688361590897'), message.client.emojis.cache.get('681963688411922460')];
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		message.channel.send(Embed[0]).then(sent => {
			sent.react(arrows[0])
				.then(() => sent.react(arrows[1]))
				.then(() => {
					const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
					collector.on('collect', reaction => {
						const maxpage = 2;
						if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0)?(SelectedEmbed - 1):maxpage;
						else SelectedEmbed = (SelectedEmbed < maxpage)?(SelectedEmbed + 1):0;
						sent.edit(Embed[SelectedEmbed]);
					});
				}).then(() => message.channel.stopTyping(true));
		});
    },
};