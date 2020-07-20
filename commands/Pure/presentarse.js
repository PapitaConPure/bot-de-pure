const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'presentarse',
    aliases: [
        'presentacion', 'presentación', 'hola', 'presentar', 'puré', 'pure'
    ],
	execute(message, args) {
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' +
            '***PRESENTACIÓN***\n' +
            '*¡Permíteme presentarme!*\n\n' +
            '¡Hola! Soy __Bot de Puré__, un bot dedicado al entretenimiento con tecnologías de complemento de chat y de búsqueda de imágenes.\n' +
            'Habiendo sido creado como un proyecto de prueba para un evento competitivo de una pequeña comunidad, actualmente me encuentro como un bot bastante decente y con varias funcionalidades extra que ya distorsionaron mi propósito original por completo.' +
            ' ¡No dudes en investigar lo que puedo hacer! Al menos una risa te vas a llevar.\n\n' +
            '```css\n' +
            `[Versión actual]: ${global.bot_version}\n` +
            `[Estado]: ${global.bot_status}\n` +
            `[Desarrollador]: Papita con Puré#6932::423129757954211880\n` +
            '```\n' +
            '**`[REPORTE 18/07]`**\n' +
            '```\n' +
            '- Problemas con recolección de emotes personalizados.\n' +
            '- Problemas con mensajes enviados a través de Embeds.\n' +
            '- Se esperan más problemas relacionados a otras funciones de Discord.\n' +
            '```\n' +
            '**`[REPORTE 20/07]`**\n' +
            '```\n' +
            '- Se llegó al origen del problema y se está implementando una solución.\n' +
            '- Se están restaurando los comandos afectados de a poco.\n' +
            '```\n' +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n'
        );
    },
};