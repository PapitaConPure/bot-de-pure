const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'presentarse',
    aliases: [
        'presentacion', 'presentación'
    ],
	execute(message, args) {
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' +
            '***PRESENTACIÓN***\n' +
            '*¡Permíteme presentarme!*\n' +
            '¡Hola! Soy __Bot de Puré__, un bot dedicado al entretenimiento con tecnologías competitivas, de complemento de chat y de búsqueda de imágenes.' +
            'Habiendo sido creado como un proyecto de prueba para un evento competitivo de una pequeña comunidad, actualmente me encuentro como un bot bastante decente y con varias funcionalidades extra que ya distorsionaron mi propósito original por completo.\n' +
            '¡No dudes en investigar lo que puedo hacer en el día-a-día de este server!\n\n' +
            `\`Versión actual: ${global.bot_version}\`` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n'
        );
    },
};