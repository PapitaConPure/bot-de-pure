const { MessageEmbed } = require('discord.js');
const global = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'terraria',
	aliases: [
		'terra'
	],
	desc: 'Comando para mostrar información sobre el server de Terraria de Hourai Doll (horario, cómo unirse, etc).',
	flags: [
		'hourai'
	],

	execute(message, args) {
		const embed = new MessageEmbed()
			.setColor('#39b715') 
			.setAuthor('Terraria » Hourai Doll', 'https://i.imgur.com/o2V6IX6.jpg')
			.setTitle('Información y Guía')
			.addField('Horario', ':earth_americas: 7PM~1AM UTC\n:flag_mx: 2PM~8PM GMT-5\n:flag_ar: 4PM~10PM GMT-3', true)
			.addField('RadminVPN', ':link: [Descargar](https://www.radmin-vpn.com/es/)\n:globe_with_meridians: Hourai Doll\n:closed_lock_with_key: voodoo', true)
			.addField('Terraria', ':moneybag: [Comprar](https://store.steampowered.com/app/105600/Terraria/)\n:pirate_flag: [Descargar](https://www.mediafire.com/file/m6hh8avyt58aqmo/T3rr4r1a-v1.4.2.3.rar/file)\n:hash: 26.93.83.58', true)
			.addField('Guía Básica', 'Para jugar, necesitarás la versión más reciente de Terraria y RadminVPN encendido y conectado a nuestra red. Luego de eso abre Terraria, ve a Multiplayer, conéctate con la IP especificada y... ¡a jugar!');
		message.channel.send(embed);
	}
};