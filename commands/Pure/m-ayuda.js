var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'm-ayuda',
    aliases: [
        'm-comandos', 'm-acciones',
        'm-help', 'm-commands',
        'm-h'
    ],
	execute(message, args) {
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***LISTA DE COMANDOS DE MODERACIÓN***\n' +
            '**A continuación la lista de comandos de moderación.**\n' +
            '*Puré:*\n' +
            `\t╠ \`${global.p_pure}m-borrarmsg\` para borrar mensajes.\n` +
            `\t╚ \`${global.p_pure}m-info\` para mostrar información general del servidor.\n` +
            '*Drawmaku:*\n' +
            `\t╚ \`${global.p_drmk}ayuda \` ayuda expandida de *__Drawmaku (moderación)__*.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};