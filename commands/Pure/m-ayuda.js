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
            `\t╠ \`${global.p_pure}m-borrarmsg\` para borrar mis mensajes (solo bot).\n` +
            `\t╚ \`${global.p_pure}m-info\` para mostrar información general del servidor.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};