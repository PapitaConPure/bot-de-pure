var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'ayuda',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***LISTA DE COMANDOS***\n' +
            '**A continuación la lista de comandos.**\n' +
            '*Puré:*\n' +
            `\t\`${global.p_pure}gatos \` para mostrar imágenes de gatitos.\n` +
            `\t\`${global.p_pure}café \` para mostrar imágenes de café.\n` +
            `\t\`${global.p_pure}touhou \` para mostrar imágenes de tohas.\n` +
            `\t\`${global.p_pure}uwu \` uwu.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};