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
			let textcnt = 0;
			let voicecnt = 0;
			let categorycnt = 0;
			let peoplecnt = guild.members.filter(member => !member.user.bot).size;
			let botcnt = guild.memberCount - peoplecnt;
			message.guild.channels.forEach(channel => {
				if(channel.type === 'text') textnct++;
				else if(channel.type === 'voice') voicecnt++;
				else if(channel.type === 'category') categorycnt++;
			});

			//Crear y usar embed
			const Embed = new Discord.RichEmbed()
				.setColor('#ffd500')
				.setTitle('Información del servidor OwO')
				.addField('Nombre', message.guild.name)
				.addField('Usuarios', `:wrestlers: x ${peoplecnt}\n:robot: x ${botcnt}`, true)
				.addField('Canales', `:hash: x ${textcnt}\n:loud_sound: x ${voicecnt}\n:label: x ${categorycnt}`, true)

				.addField('Región', message.guild.region, false)
				.addField('Creador', `${message.guild.owner.username}\n[${message.guild.owner.id}]`, true)
				.addField('Nivel de verificación', message.guild.verificationLevel, true)

				.addField('Fecha de creación', message.guild.createdAt, false)
				.addField('ID', message.guild.id, true)

				.addImage(message.guild.iconURL);
			tmpch.send(Embed);
		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
    },
};