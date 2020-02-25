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

			//Contadores de canales
			let textcnt = 0; //Texto
			let voicecnt = 0; //Voz
			let categorycnt = 0; //Categorías
			let msgcnt = []; //Mensajes
			let chid = []; //Mensajes

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

			//Ordenamiento burbuja
			for(let i = 1; i < textcnt; i++)
				for(let j = 0; j < (textcnt - i); j++)
					if(msgcnt[j] < msgcnt[j + 1]) {
						let tmp = msgcnt[j];
						msgcnt[j] = msgcnt[j + 1];
						msgcnt[j + 1] = tmp;
						tmp = chid[j];
						chid[j] = chid[j + 1];
						chid[j + 1] = tmp;
					}
			
			//Creacion de top 5
			let mstactch = ''; //Lista de canales más activos
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
				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL);

			Embed[1] = new Discord.RichEmbed()
				.setColor('#eebb00')
				.setTitle('Estadísticas de actividad ÛwÕ')

				.addField('Usuarios más activos', `Sample Text:tm:`)
				.addField('Canales más activos', mstactch)

				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
				.setFooter(`Nota: estas estadísticas toman información desde el último reinicio del bot hasta la actualidad.`);
			
			const arrows = [message.client.emojis.get('681963688361590897'), message.client.emojis.get('681963688411922460')];
			const filter = rc => true/*arrows.some(arrow => rc.emoji.id === arrow.id)*/;
			message.channel.send(Embed[0]).then(sent => {
				sent.react(arrows[0])
					.then(() => sent.react(arrows[1]))
    				.then(() =>
						sent.awaitReactions(filter, { time: 120 * 60, max: 30 })
							.then(collected => {
								SelectedEmbed = (SelectedEmbed === 0)?1:0;
								sent.edit(Embed[SelectedEmbed]);
								sent.channel.send(`Wea.`);
							})
					)
			});
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};