const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { readdirSync } = require('fs'); //Para el contador de comandos

module.exports = {
	name: 'presentar',
    aliases: [
        'presentacion', 'presentación', 'hola', 'presentarse', 'puré', 'pure'
    ],
    desc: 'Me presento y digo cositas sobre mí~',
    flags: [
        'common'
    ],
    options: [

    ],
	
	execute(message, args) {
        const embed = new MessageEmbed()
            .setColor('#608bf3')
            .setAuthor('Presentación', message.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setThumbnail('https://i.imgur.com/9Pn738u.jpg')
            .addField('Creador/Dueño', ':potato: Papita con Puré#6932', true)
            .addField('Participantes', ':horse: GoddamnBernkastel#7784\n:cowboy: Imagine Breaker#6299\n:poultry_leg: Sassafras#3331', true)
            .addField('Colaboradores', ':peach: Rakkidei#4790\n:face_with_monocle: Super Arathy\'s 12#8235\n:dog: Taton#0122', true)
            .addField('¡Permíteme presentarme!', '¡Hola! Soy __Bot de Puré__ (:female_sign:), un bot dedicado al entretenimiento con tecnologías de complemento de chat y de búsqueda de imágenes')
            .addField('Historia', 'Habiendo sido creado como un proyecto de prueba para un evento competitivo de una pequeña comunidad, actualmente me encuentro como un bot bastante decente y con varias funcionalidades extra que ya distorsionaron mi propósito original por completo')
            .addField('¡Juguemos juntos~♪!', '¡No dudes en investigar lo que puedo hacer! Al menos una risa te vas a llevar')
            .addField('Por cierto...', 'La mayoría de imágenes que Bot de Puré utiliza fueron dibujadas por Rakkidei, puedes seguirlo en [Twitter](https://twitter.com/rakkidei) y [pixiv](https://www.pixiv.net/en/users/58442175) (donde también puedes encontrar sus otras redes y demás)')
            .addField('Comandos', `¡Ofrezco ${readdirSync('./commands/Pure').filter(file => file.endsWith('.js')).length} comandos en total!`)
            .addField('Comentario de mi padre', '_"Quiero café. Necesito café, ya."_');

        message.channel.send(embed);
    },
};