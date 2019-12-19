const Discord = require('discord.js'); //Integrar discord.js
var global = require('../config.json'); //Variables globales
var func = require('../func.js'); //Funciones globales

module.exports = {
	name: 'm-ayuda',
    aliases: [
        'm-comandos',
        'm-help', 'm-commands',
        'm-h'
    ],
	execute(message, args) {
		message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***LISTA DE COMANDOS DE MODERACIÓN***\n' +
            '**A continuación la lista de comandos de moderación.**\n' +
            '*Drawmaku:*\n' +
            `\t\`${global.p_drmk}m-empezar\` para empezar el drawmaku y permitir el ingreso durante un tiempo.\n` +
            `\t\`${global.p_drmk}m-terminar\` para terminar el drawmaku.\n` +
            `\t\`${global.p_drmk}m-tiempo <tiempo de espera*>\` para cambiar el tiempo de espera de entrada al evento (en segundos).\n` +
            `\t\`${global.p_drmk}m-edi <número de edición*>\` para cambiar la edición del evento.\n` +
            `\t\`${global.p_drmk}m-tem <nombre de temática*>\` para cambiar la temática del evento.\n` +
            `\t\`${global.p_drmk}m-desc <descripción*>\` para cambiar la breve descripción que se muestra en todos los eventos.\n` +
            `\t\`${global.p_drmk}m-desctem <descripción*>\` para cambiar la breve descripción de la temática de un evento.\n` +
            `\t\`${global.p_drmk}m-expulsar <@jugadorA*> <@jugadorB> <@jugadorC>...\` para expulsar jugadores del evento.\n` +
            `\t\`${global.p_drmk}m-saltar\` para forzar a un usuario a dejar de dibujar.\n` +
            `\t\`${global.p_drmk}m-cambiarpt <@jugador> <cantidad>\` para sumar o restar puntos a un jugador.\n` +
            `\t\`${global.p_drmk}m-aprobar\` para aprobar una recompensa.\n` +
            `\t\`${global.p_drmk}m-desaprobar\` para desaprobar y reiniciar una recompensa.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
	},
};