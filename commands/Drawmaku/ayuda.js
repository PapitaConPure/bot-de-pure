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
            '*Drawmaku:*\n' +
            `\t├ \`${global.p_drmk}entrar <apodo>\` para entrar al evento, solo si se está empezando.\n` +
            `\t├ \`${global.p_drmk}salir\` para salir del evento, solo si se está dentro.\n` +
            `\t├ \`${global.p_drmk}danmaku ||<danmaku*>||\` para ingresar el nombre de tu danmaku.\n` +
            `\t│ \t├ ***¡No olvides las \\|\\|barras verticales\\|\\|!***\n` +
            `\t│ \t└ ***Para adjuntar tu dibujo, debes usar un comando aparte.***\n` +
            `\t├ \`${global.p_drmk}danmaku <imagen adjunta del danmaku*>\` para ingresar el dibujo de tu danmaku.\n` +
            `\t│ \t├ ***Se tiene que adjuntar el dibujo junto al comando.***\n` +
            `\t│ \t└ ***Para establecer el nombre de tu danmaku, debes usar un comando aparte.***\n` +
            `\t├ \`${global.p_drmk}recomp <@jugador*>\` para darle un punto a un jugador por adivinar y mostrar el nombre de la spell.\n` +
            `\t├ \`${global.p_drmk}lista\` para mostrar la lista de jugadores y sus puntajes.\n` +
            `\t├ \`${global.p_drmk}turno\` para ver a quién le toca dibujar.\n` +
            `\t├ \`${global.p_drmk}saltar\` para dejar de dibujar (si se está dibujando).\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};