var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'ayuda',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        let str = 
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***LISTA DE COMANDOS***\n' +
            '**A continuación la lista de comandos.**\n' +
            '*Puré:*\n' +
            `\t╠ \`${global.p_pure}café <tags [Giphy]>\` para mostrar imágenes de café.\n` +
            `\t╠ \`${global.p_pure}decir <¿borrar original?> <texto*>\` para hacerme decir algo.\n` +
            `\t║ \t\t╚ ***Agrega de argumento \`del\` para borrar __tu__ mensaje.***\n` +
            `\t╠ \`${global.p_pure}gatos\` para mostrar imágenes de gatitos.\n` +
            `\t╠ \`${global.p_pure}touhou <número de página> <tags [Gelbooru]>\` para mostrar imágenes de tohas.\n` +
            `\t║ \t\t╚ ***En canales marcados como "NSFW", los resultados serán lewds.***\n` +
            `\t╠ \`${global.p_pure}uwu\` uwu.\n` +
            `\t╚ \`${global.p_pure}uwus <duración [segundos]>\` evento uwu.\n`;
        
        if(args.length) 
            if(args[0] === 'meme-boi')
                str +=
                    '*Puré [:egg::unlock:]:*\n' +
                    `\t╠ \`${global.p_pure}bern\` comando de baile de GoddamnBernkastel.\n` +
                    `\t╠ \`${global.p_pure}fuee\` comando de frase de Dylan/Fuee.\n` +
                    `\t╠ \`${global.p_pure}imagine\` comando de grito de Imagine Breaker.\n` +
                    `\t╠ \`${global.p_pure}mari\` comando de caras (aleatorias) de Marisaac.\n` +
                    `\t╠ \`${global.p_pure}megumin <número de página> <tags [Gelbooru]>\` comando de imágenes de Megumin uwu.\n` +
                    `\t║ \t\t╠ ***No funciona en cualquier servidor.***\n` +
                    `\t║ \t\t╚ ***En canales marcados como "NSFW", los resultados serán lewds U//w//U.***\n` +
                    `\t╠ \`${global.p_pure}orphen\` comando de grito de cuidado de Orphen.\n` +
                    `\t╠ \`${global.p_pure}papita\` comando de lechita:tm: de Papita con Puré:registered:.\n` +
                    `\t║ \t\t╚ ***En canales marcados como "NSFW", mandará un shitpost adecuado para la situación.***\n` +
                    `\t╚ \`${global.p_pure}sassafras <¿sassamodo?>\` comando de perturbación de Sassafras.\n` +
                    `\t\t\t\t╠ ***En algunos canales establecidos de antemano, Sassafras liberará un 5% de su enojo en un solo mensaje.***\n` +
                    `\t\t\t\t╚ ***Agrega de argumento \`forzar-sassamodo\` para forzar ese resultado, pero revisa bien dónde lo harás.***\n`;
        
        str +=
            '*Drawmaku:*\n' +
            `\t╚ \`${global.p_drmk}ayuda \` ayuda expandida de *__Drawmaku__*.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬';
        
        message.channel.send(str);
    },
};