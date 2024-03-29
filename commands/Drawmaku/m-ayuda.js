const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'ayuda',
    aliases: [
        'comandos',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
		message.channel.send({
            content:
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                '***LISTA DE COMANDOS DE MODERACIÓN***\n' +
                '**A continuación la lista de comandos de moderación.**\n' +
                '*Drawmaku:*\n' +
                `\t╠ \`${global.p_drmk}empezar\` para empezar el drawmaku y permitir el ingreso durante un tiempo.\n` +
                `\t╠ \`${global.p_drmk}terminar\` para terminar el drawmaku.\n` +
                `\t╠ \`${global.p_drmk}tiempo <tiempo de espera*>\` para cambiar el tiempo de espera de entrada al evento (en segundos).\n` +
                `\t╠ \`${global.p_drmk}edi <número de edición*>\` para cambiar la edición del evento.\n` +
                `\t╠ \`${global.p_drmk}tem <nombre de temática*>\` para cambiar la temática del evento.\n` +
                `\t╠ \`${global.p_drmk}desc <descripción*>\` para cambiar la breve descripción que se muestra en todos los eventos.\n` +
                `\t╠ \`${global.p_drmk}desctem <descripción*>\` para cambiar la breve descripción de la temática de un evento.\n` +
                `\t╠ \`${global.p_drmk}expulsar <@jugadorA*> <@jugadorB> <@jugadorC>...\` para expulsar jugadores del evento.\n` +
                `\t╠ \`${global.p_drmk}saltar <cantidad de turnos>\` para forzar a uno o más usuarios a dejar de dibujar.\n` +
                `\t╠ \`${global.p_drmk}cambiarpt <@jugador*> <cantidad>\` para sumar o restar puntos a un jugador.\n` +
                `\t║ \t\t╠ ***Al no ingresar la cantidad se suma un punto.***\n` +
                `\t║ \t\t╚ ***Usa el símbolo menos en el parámetro de cantidad para restar puntos.***\n` +
                `\t╠ \`${global.p_drmk}aprobar\` para aprobar una recompensa.\n` +
                `\t╠ \`${global.p_drmk}desaprobar\` para desaprobar y reiniciar una recompensa.\n` +
                `\t╚ \`${global.p_drmk}todo\` para mostrar todas las imágenes publicadas, una vez finalizado el evento.\n` +
                `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios__*\n` +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        });
	},
};