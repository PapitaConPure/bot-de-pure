const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'presentarse',
    aliases: [
        'presentacion', 'presentación', 'hola', 'presentar', 'puré', 'pure'
    ],
	execute(message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor('#608bf3')
            .setAuthor('Presentación', message.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setImage('https://i.imgur.com/9Pn738u.jpg')
            .addField('¡Permíteme presentarme!', '¡Hola! Soy __Bot de Puré__, un bot dedicado al entretenimiento con tecnologías de complemento de chat y de búsqueda de imágenes')
            .addField('Historia', 'Habiendo sido creado como un proyecto de prueba para un evento competitivo de una pequeña comunidad, actualmente me encuentro como un bot bastante decente y con varias funcionalidades extra que ya distorsionaron mi propósito original por completo')
            .addField('¡Juguemos juntos~♪!', '¡No dudes en investigar lo que puedo hacer! Al menos una risa te vas a llevar')
            .addField('Por cierto...', 'La mayoría de imágenes que Bot de Puré utilizan fueron dibujadas por Rakkidei, puedes seguirlo en [Twitter](https://twitter.com/rakkidei) y [pixiv](https://www.pixiv.net/en/users/58442175) (donde también puedes encontrar sus otras redes y demás)');

        message.channel.send(embed);
    },
};