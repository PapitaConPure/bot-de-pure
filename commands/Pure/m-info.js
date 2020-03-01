const Discord = require('discord.js'); //Integrar discord.js
let global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-info',
	aliases: [
		'm-informacion', 'm-información', 'm-inf',
        'm-serverinfo', 'm-svinfo', 'm-svinf'
    ],
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_ROLES', false, true, true)) {
			const servidor = message.channel.guild; //Variable que almacena un objeto del servidor a analizar
			let selectch;

			//Contadores de canales
			let textcnt = 0; //Texto
			let voicecnt = 0; //Voz
			let categorycnt = 0; //Categorías
			let msgcnt = []; //Contador de mensajes (parte "cantidad")
			let chid = []; //Mensajes (parte "id")
			let peocnt = []; //Contador de personas (parte "cantidad")
			let peoid = []; //Contador de personas (parte "id")

			//Contadores de usuarios
			let	peoplecnt = servidor.members.filter(member => !member.user.bot).size; //Biológicos
			let botcnt = servidor.memberCount - peoplecnt; //Bots

			//Procesado de información canal-por-canal
			servidor.channels.forEach(channel => {
				if(channel.type === 'text') {
					msgcnt[textcnt] = channel.messages.size;
					chid[textcnt] = channel.id;
					textcnt++;
				} else if(channel.type === 'voice') voicecnt++;
				else if(channel.type === 'category') categorycnt++;
			});
			
			if(args.length) {
				if(args[0].startsWith('<#') && args[0].endsWith('>')) {
					args[0] = args[0].slice(2, -1);
					if(args[0].startsWith('!')) args[0] = args[0].slice(1);
				}

				selectch = message.guild.channels.get(args[0]);
			}
			if(args.length && typeof selectch !== undefined) {
				let i = 0;
				selectch.members.filter(member => !member.user.bot).forEach(member => {
					peocnt[i] = selectch.messages.filter(m => m.author.id === member.user.id).size;
					peoid[i] = member.user.id;
					i++;
				});
			}

			//Ordenamiento burbuja
			for(let i = 1; i < textcnt; i++)
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
					}
				
			//Creacion de top 5
			let mstactpeo = ''; //Lista de personas más activas
			let mstactch = ''; //Lista de canales más activos
			for(let i = 0; i < Math.min(peoid.length, 5); i++)
				mstactpeo += `<@${peoid[i]}>: **${peocnt[i]}** mensajes.\n`;
			for(let i = 0; i < Math.min(textcnt, 5); i++)
				mstactch += `<#${chid[i]}>: **${msgcnt[i]}** mensajes.\n`;

			//Crear y usar embed
			let SelectedEmbed = 0;
			let Embed = [];

			Embed[0] = new Discord.RichEmbed()
				.setColor('#ffd500')
				.setTitle('Información del servidor OwO')

				.addField('Nombre', servidor.name, true)
				.addField('Usuarios', `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}`, true)
				.addField('Canales', `:hash: x ${textcnt}\n:loud_sound: x ${voicecnt}\n:label: x ${categorycnt}`, true)

				.addField('Región', servidor.region, true)
				.addField('Creador', `${servidor.owner.user.username}\n[${servidor.owner.id}]`, true)
				.addField('Nivel de verificación', servidor.verificationLevel, true)

				.addField('Fecha de creación', servidor.createdAt, true)
				.addField('ID', servidor.id, true)

				.setImage(servidor.iconURL)
				.setThumbnail(servidor.owner.user.avatarURL)
				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
				.setFooter(`Estas estadísticas toman información concreta.`);

			Embed[1] = new Discord.RichEmbed()
				.setColor('#eebb00')
				.setTitle('Estadísticas de actividad ÛwÕ')

				.addField(`Usuarios más activos (canal: ${(args.length && typeof selectch !== undefined)?selectch.name:'ninguno'})`, `${(args.length && typeof selectch !== undefined)?mstactpeo:'Ingresa un #canal como argumento para ver estadísticas del mismo.'}`)
				.addField('Canales más activos', mstactch)

				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
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

			Embed[2] = new Discord.RichEmbed()
				.setColor('#e99979')
				.setTitle('Estadísticas de tiempo UwU')

				.addField('Tiempo de vida del servidor', 
					`**${serveryear}** años, **${servermonth}** meses, **${serverday}** días, **${serverhour}**º**${servermin}**' **${serversec}.${serverms}**''`)
				.addField('Tiempo de funcionamiento del bot', 
					`**${bothour}**hs. **${botmin}**min. **${botsec}.${botms}**seg.`)

				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
				.setFooter(`Estas estadísticas toman información concreta.`);
			
			const arrows = [message.client.emojis.get('681963688361590897'), message.client.emojis.get('681963688411922460')];
			const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
			message.channel.send(Embed[0]).then(sent => {
				sent.react(arrows[0])
					.then(() => sent.react(arrows[1]))
    				.then(() => {
						const collector = sent.createReactionCollector(filter, { time: 120 * 1000 });
						collector.on('collect', reaction => {
							const maxpage = 2;
							if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0)?(SelectedEmbed - 1):maxpage;
							else SelectedEmbed = (SelectedEmbed < maxpage)?(SelectedEmbed + 1):0;
							sent.edit(Embed[SelectedEmbed]);
						});
					});
			});
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};