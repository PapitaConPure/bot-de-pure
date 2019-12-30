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
            `\t╠ \`${global.p_pure}gatos \` para mostrar imágenes de gatitos.\n` +
            `\t╠ \`${global.p_pure}café <tags [Giphy]>\` para mostrar imágenes de café.\n` +
            `\t╠ \`${global.p_pure}touhou <rango de páginas> <tags [Gelbooru]>\` para mostrar imágenes de tohas.\n` +
            `\t║ \t\t╚ ***En canales marcados como "NSFW", los resultados serán lewds.***\n` +
            `\t╚ \`${global.p_pure}uwu \` uwu.\n` +
            '*Drawmaku:*\n' +
            `\t╚ \`${global.p_drmk}ayuda \` ayuda expandida de *__Drawmaku__*.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};