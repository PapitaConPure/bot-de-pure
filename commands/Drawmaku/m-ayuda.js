const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-ayuda',
    aliases: [
        'm-comandos',
        'm-help', 'm-commands',
        'm-h'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
		message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***LISTA DE COMANDOS DE MODERACIÓN***\n' +
            '**A continuación la lista de comandos de moderación.**\n' +
            '*Drawmaku:*\n' +
            `\t╠ \`${global.p_drmk}m-empezar\` para empezar el drawmaku y permitir el ingreso durante un tiempo.\n` +
            `\t╠ \`${global.p_drmk}m-terminar\` para terminar el drawmaku.\n` +
            `\t╠ \`${global.p_drmk}m-tiempo <tiempo de espera*>\` para cambiar el tiempo de espera de entrada al evento (en segundos).\n` +
            `\t╠ \`${global.p_drmk}m-edi <número de edición*>\` para cambiar la edición del evento.\n` +
            `\t╠ \`${global.p_drmk}m-tem <nombre de temática*>\` para cambiar la temática del evento.\n` +
            `\t╠ \`${global.p_drmk}m-desc <descripción*>\` para cambiar la breve descripción que se muestra en todos los eventos.\n` +
            `\t╠ \`${global.p_drmk}m-desctem <descripción*>\` para cambiar la breve descripción de la temática de un evento.\n` +
            `\t╠ \`${global.p_drmk}m-expulsar <@jugadorA*> <@jugadorB> <@jugadorC>...\` para expulsar jugadores del evento.\n` +
            `\t╠ \`${global.p_drmk}m-saltar <cantidad de turnos>\` para forzar a uno o más usuarios a dejar de dibujar.\n` +
            `\t╠ \`${global.p_drmk}m-cambiarpt <@jugador*> <cantidad>\` para sumar o restar puntos a un jugador.\n` +
            `\t║ \t\t╠ ***Al no ingresar la cantidad se suma un punto.***\n` +
            `\t║ \t\t╚ ***Usa el símbolo menos en el parámetro de cantidad para restar puntos.***\n` +
            `\t╠ \`${global.p_drmk}m-aprobar\` para aprobar una recompensa.\n` +
            `\t╚ \`${global.p_drmk}m-desaprobar\` para desaprobar y reiniciar una recompensa.\n` +
            `\t╚ \`${global.p_drmk}m-todo\` para mostrar todas las imágenes publicadas, una vez finalizado el evento.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
	},
};