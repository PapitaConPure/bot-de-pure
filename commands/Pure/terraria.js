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
			.addField('Horario', ':clock3: <t:1626116400:t>~<t:1626138000:t>\n:crossed_swords: <t:1626123600:t>~<t:1626134400:t>', true)
			.addField('RadminVPN', ':link: [Descargar](https://www.radmin-vpn.com/es/)\n:globe_with_meridians: Hourai Doll\n:closed_lock_with_key: voodoo', true)
			.addField('Terraria', ':moneybag: [Comprar](https://store.steampowered.com/app/105600/Terraria/)\n:pirate_flag: [Descargar](https://www.mediafire.com/file/m6hh8avyt58aqmo/T3rr4r1a-v1.4.2.3.rar/file)\n:hash: 26.93.83.58', true)
			.addField('Guía Básica', 'Para jugar, necesitarás la versión más reciente de Terraria y RadminVPN encendido y conectado a nuestra red. Luego de eso abre Terraria, ve a Multiplayer, conéctate con la IP especificada y... ¡a jugar!')
			.addField('A tener en cuenta', 'Jugamos con personajes clásicos en experto o superior y hacemos progresos importantes en un cierto :crossed_swords: **rango de tiempo**.\nEl servidor debería abrir todos los días dentro de las :clock3: **horas indicadas**. Si tienes problemas para conectarte, habla con el staff.');
		message.channel.send(embed);
	}
};