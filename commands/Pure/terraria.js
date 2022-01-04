const { MessageEmbed } = require('discord.js');

const embeds = [
	new MessageEmbed()
		.setColor('#39b715') 
		.setAuthor('Terraria » Hourai Doll', 'https://i.imgur.com/o2V6IX6.jpg')
		.setTitle('Información y Guía')
		.addField('Horario', '<t:1641326400:t>~<t:1641340800:t>\n_(Adaptado a tu hora)_', true)
		//.addField('Horario', ':clock3: <t:1626116400:t>~<t:1626138000:t>\n:crossed_swords: <t:1626123600:t>~<t:1626134400:t>\n_(Adaptado a tu hora)_', true)
		//.addField('RadminVPN', ':link: [Descargar](https://www.radmin-vpn.com/es/)\n:globe_with_meridians: Hourai Doll\n:closed_lock_with_key: voodoo', true)
		//.addField('Terraria', ':moneybag: [Comprar](https://store.steampowered.com/app/105600/Terraria/)\n:pirate_flag: [Descargar](https://www.mediafire.com/file/m6hh8avyt58aqmo/T3rr4r1a-v1.4.2.3.rar/file)\n:hash: 26.93.83.58', true)
		.addField('Conexión', '[Terraria en Steam](https://store.steampowered.com/app/105600/Terraria/)\nCódigo de amigo: 233584937', true)
		.addField('Mundo actual', '💀 Master Mode\n🧠 Crimson\n🃏 Semilla de Don\'t Starve', true)
		//.addField('Guía Básica', 'Para jugar, necesitarás la versión más reciente de Terraria y RadminVPN encendido y conectado a nuestra red. Luego de eso abre Terraria, ve a Multiplayer, conéctate con la IP especificada y... ¡a jugar!')
		.addField('Guía Básica', 'Para jugar: instala Terraria en Steam, agrega de amigo al código de arriba y únete a la partida cuando llamen para jugar desde el botón "Amigos y chat" de abajo a la derecha')
		.addField('Tener en cuenta', 'Jugamos con personajes clásicos en experto o superior y hacemos progresos importantes cuando haya suficientes jugadores habituales.\nEl servidor debería abrir todos los días dentro de las horas indicadas. Si tienes problemas para conectarte, pregunta al staff'),
	//new MessageEmbed()
		//.setColor('#996543')
		//.setThumbnail('https://i.imgur.com/UrJxhEW.gif')
		//.setImage('https://i.imgur.com/twjFjoh.gif'),
]
module.exports = {
	name: 'terraria',
	aliases: [
		'terra'
	],
	brief: 'Muestra información del server de Terraria (solo Hourai Doll)',
	desc: 'Muestra información sobre el server de Terraria de Hourai Doll (horario, cómo unirse, etc)',
	flags: [
		'hourai',
		//'outdated'
	],

	async execute(message, _) {
		message.reply({ embeds: embeds });
	}
};