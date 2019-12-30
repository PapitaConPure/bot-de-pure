const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-info',
	aliases: [
		'm-informacion', 'm-información', 'm-inf',
        'm-serverinfo', 'm-svinfo', 'm-svinf'
    ],
	execute(message, args) {
		if(message.member.hasPermission('MANAGE_ROLES', false, true, true)) {
			const servidor = message.channel.guild;
			let textcnt = 0;
			let voicecnt = 0;
			let categorycnt = 0;
			let peoplecnt = servidor.members.filter(member => !member.user.bot).size;
			let botcnt = servidor.memberCount - peoplecnt;
			servidor.channels.forEach(channel => {
				if(channel.type === 'text') textcnt++;
				else if(channel.type === 'voice') voicecnt++;
				else if(channel.type === 'category') categorycnt++;
			});

			//Crear y usar embed
			const Embed = new Discord.RichEmbed()
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

				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL)
				.setImage(servidor.iconURL)
				.setThumbnail(servidor.owner.user.avatarURL);
			message.channel.send(Embed);
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};