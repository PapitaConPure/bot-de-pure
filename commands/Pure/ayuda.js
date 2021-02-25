const fs = require('fs'); //Integrar operaciones sistema de archivos de consola
const Discord = require('discord.js');
const global = require('../../config.json'); //Variables globales
const { stringify } = require('querystring');

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
    options: [
        '`-x`para filtrar resultados comunes',
        '`--meme` para ver comandos meme',
        '`-m` o `--mod` para ver comandos de moderación',
        '`-p` o `--papa` para ver comandos de Papita con Puré',
        '`-h` o `--hourai` para ver comandos exclusivos de Hourai'
    ],
    
	execute(message, args) {
        let commands = new Discord.Collection();
        const cfiles = fs.readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
        let fex = false;
        let fmeme = false;
        let fmod = false;
        let fpapa = false;
        let fhourai = false;
        let search = 'n';
        args.some(arg => {
            if(arg.startsWith('--'))
                switch(arg.slice(2)) {
                case 'meme': fmeme = true; break;
                case 'mod': fmod = true; break;
                case 'papa': fpapa = true; break;
                case 'hourai': fhourai = true; break;
                }
            else if(arg.startsWith('-')) {
                for(c of arg.slice(1))
                    switch(c) {
                    case 'x': fex = true; break;
                    case 'm': fmod = true; break;
                    case 'p': fpapa = true; break;
                    case 'h': fhourai = true; break;
                    }
            } else if(search === 'n')
                search = arg;
        });

        let list = {
            'name': [],
            'aliases': [],
            'flags': [],
            'options': [],
            'desc': ''
        };
        let item = 0;
        
        for(const file of cfiles) {
            const command = require(`../../commands/Pure/${file}`);
            if(search === 'n') {
                const cmeme = fmeme? true : !command.flags.includes('meme');
                const cmod = fmod? true : !command.flags.includes('mod');
                const cpapa = fpapa? true : !command.flags.includes('papa');
                const chourai = fhourai? true : !command.flags.includes('hourai');
                const cex = fex? !command.flags.includes('common') : true;
            
                if((cmeme && cmod && cpapa && chourai && cex)) {
                    list.name[item] = command.name;
                    item++;
                }
            } else if(search === command.name || ((command.aliases !== undefined)?command.aliases.some(alias => alias === search):false)) {
                list.name[0] = command.name;
                list.aliases = command.aliases;
                list.flags = command.flags;
                list.options = command.options;
                list.desc = command.desc;
                break;
            }
        }

        const aurl = message.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 });
        let embed = new Discord.MessageEmbed().setColor('#608bf3');
        if(search === 'n') {
            embed.setAuthor('Lista de comandos', aurl)
            .addField('Añade...',
                '`-x` para filtrar resultados comunes\n' +
                '`--meme` para ver comandos meme\n' +
                '`-m` o `--mod` para ver comandos de moderación\n' +
                '`-p` o `--papa` para ver comandos de Papita con Puré\n' +
                '`-h` o `--hourai` para ver comandos exclusivos de Hourai'
            )
            .addField('Usa `p!ayuda <comando>` para más información', (list.name.length > 0)?list.name.map(item => `\`${item}\``).join(', '):'Sin resultados (remueve la bandera -x si no la necesitas).');
        } else {
            const title = s => {
                s = (s.startsWith('m-'))?`${s.slice(2)} (Mod)`:s;
                s = (s.startsWith('papa-'))?`${s.slice(5)} (Papita con Puré)`:s;
                return `${s[0].toUpperCase()}${s.slice(1)}`;
            };
            if(list.name.length > 0) 
                embed.setAuthor(title(list.name[0]), aurl)
                    .addField('Nombre', list.name[0], true)
                    .addField('Alias', (list.aliases.length > 0)?(list.aliases.map(i => `\`${i}\``).join(', ')):':label: Este comando no tiene ningún alias', true)
                    .addField('Características', (list.flags.length > 0)?(list.flags.map(i => `\`${i}\``).join(', ').toUpperCase()):':question: Este comando no tiene banderas por ahora')
                    .addField('Llamado', `\`p!${list.name[0]}\``, true)
                    .addField('Opciones (`p!x -x --xxx`)', (list.options.length > 0)?list.options.join('\n'):':abacus: Este comando no tiene `--opciones` adicionales', true)
                    .addField('Descripción', (list.desc.length > 0)?list.desc:':warning: Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde');
            else
                embed.setAuthor('Sin resultados', aurl)
                    .addField('No se ha encontrado ningún comando con este nombre', `Utiliza \`p!ayuda\` para ver una lista de comandos disponibles y luego usa \`p!comando <comando>\` para ver un comando en específico`);
        }
        
        let page = 0;
        const maxpage = Math.floor((list.length - 1) / 10);
        
        message.channel.send(embed);
        
        /*
        if(!memez)
            str += 
                '*Puré:*\n' +
                `\t╠ \`${global.p_pure}café <tags [Giphy]>\` \n` +
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
                `\t╠ \`${global.p_pure}fuee\` \n` +
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