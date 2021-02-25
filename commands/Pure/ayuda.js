const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js');
const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'ayuda',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
    desc: 'Muestra una lista de comandos o un comando en detalle.',
    flags: [
        'common'
    ],
    
	execute(message, args) {
        let memes = args.some(arg => arg === '-m' || arg === '--memes');
        let commands = new Discord.Collection();
        const cfiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
        let list = {
            'name': [],
            'desc': []
        };
        let item = 0;
        for(const file of cfiles) {
            const command = require(`../../commands/Pure/${file}`);

            if((memes)?command.flags.includes('meme'):true)
                //commands.set(command.name, command);
                list.name[item] = command.name;
                list.desc[item] = command.desc;
                item++;
        }
        
        let page = 1;
        const maxpage = Math.floor((list.name.length - 1) / 10);
        let embed = new Discord.MessageEmbed()
            .setColor('#608bf3')
            .setAuthor('Lista de comandos', message.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 }))
            .setFooter(`Página ${page + 1}/${maxpage + 1}`)
            .addField('Nombre', list.name.filter((_, i) => i >= (page * 10) && i < (page * 10 + 10)).join('\n'), true)
            .addField('Descripción', list.desc.filter((_, i) => i >= (page * 10) && i < (page * 10 + 10)).join('\n'), true);
        
        const arrows = [message.client.emojis.cache.get('681963688361590897'), message.client.emojis.cache.get('681963688411922460')];
        const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
        message.channel.send(embed).then(sent => {
            sent.react(arrows[0])
                .then(() => sent.react(arrows[1]))
                .then(() => {
                    const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
                    collector.on('collect', reaction => {
                        if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):maxpage;
                        else page = (page < maxpage)?(page + 1):0;

                        embed = new Discord.MessageEmbed()
                            .setColor('#608bf3')
                            .setAuthor('Lista de comandos', message.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 }))
                            .setFooter(`Página ${page + 1}/${maxpage + 1}`)
                            .addField('Nombre', list.name.filter((_, i) => i >= (page * 10) && i < (page * 10 + 10)).join('\n'), true)
                            .addField('Descripción', list.desc.filter((_, i) => i >= (page * 10) && i < (page * 10 + 10)).join('\n'), true);
                        sent.edit(embed);
                    });
                });
        });
        
        /*
        if(!memez)
            str += 
                '*Puré:*\n' +
                `\t╠ \`${global.p_pure}café <tags [Giphy]>\` para mostrar imágenes de café.\n` +
                `\t╠ \`${global.p_pure}decir <¿borrar original?> <texto*>\` para hacerme decir algo.\n` +
                `\t║ \t\t╚ ***Agrega de argumento \`del\` para borrar __tu__ mensaje.***\n` +
                `\t╠ \`${global.p_pure}emotes\` para mostrar mis emotes personalizados.\n` +
                `\t╠ \`${global.p_pure}gatos\` para mostrar imágenes de gatitos.\n` +
                `\t╠ \`${global.p_pure}presentar\` para presentarme.\n` +
                `\t╠ \`${global.p_pure}touhou <rango de páginas> <tags [Gelbooru]>\` para mostrar imágenes de tohas.\n` +
                `\t║ \t\t╚ ***En canales marcados como "NSFW", los resultados serán lewds.***\n` +
                `\t╠ \`${global.p_pure}uwu\` uwu.\n` +
                `\t╚ \`${global.p_pure}uwus <duración [segundos]>\` evento uwu.\n`;
        else
            str =
                '*Puré [:egg::unlock:]:*\n' +
                `\t╠ \`${global.p_pure}bern\` \n` +
                `\t╠ \`${global.p_pure}fuee\` comando de frase de Dylan/Fuee.\n` +
                `\t╠ \`${global.p_pure}imagine\` comando de grito de Imagine Breaker.\n` +
                `\t╠ \`${global.p_pure}juani\` comando de belleza de JuaniUru.\n` +
                `\t╠ \`${global.p_pure}karl\` comando de música de Karl Zuñiga.\n` +
                `\t╠ \`${global.p_pure}mari\` comando de caras (aleatorias) de Marisaac.\n` +
                `\t╠ \`${global.p_pure}megumin <rango de páginas> <tags [Gelbooru]>\` comando de imágenes de Megumin uwu.\n` +
                `\t║ \t\t╚ ***En canales marcados como "NSFW", los resultados serán lewds U//w//U (no funciona en cualquier servidor).***\n` +
                `\t╠ \`${global.p_pure}orphen\` comando de grito de cuidado de Orphen.\n` +
                `\t╠ \`${global.p_pure}papita\` comando de lechita:tm: de Papita con Puré:registered:.\n` +
                `\t║ \t\t╚ ***En canales marcados como "NSFW", mandará un shitpost adecuado para la situación.***\n` +
                `\t╚ \`${global.p_pure}sassafras <¿sassamodo?>\` comando de perturbación de Sassafras.\n` +
                `\t\t\t\t╠ ***En algunos canales establecidos de antemano, Sassafras liberará un 5% de su enojo en un solo mensaje.***\n` +
                `\t\t\t\t╚ ***Agrega de argumento \`forzar-sassamodo\` para forzar ese resultado, pero revisa bien dónde lo harás.***\n` +
                `\t╚ \`${global.p_pure}taton <nombre>\` comando de perritos de Taton.\n` +
                `\t\t\t\t╠ ***Agrega de argumento \`todo\` para mostrar la lista de emotes de perritos junto con sus nombres clave.***\n` +
                `\t\t\t\t╚ ***Agrega de argumento un nombre de la lista de perritos para enviar un perrito específico.***\n`;
        
        str +=
            '*Drawmaku:*\n' +
            `\t╚ \`${global.p_drmk}ayuda \` ayuda expandida de *__Drawmaku__*.\n` +
            `*__Nota: los <parámetros> con el símbolo "\\*" son obligatorios.__*\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬';
        
        message.channel.send(str);
        */
    },
};