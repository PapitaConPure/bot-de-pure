const { readdirSync } = require('fs'); //Integrar operaciones sistema de archivos de consola
const { MessageEmbed } = require('discord.js');
const { p_pure, serverid } = require('../../localdata/config.json'); //Variables globales
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
        '`<comando?>` _(texto)_ para ver ayuda en un comando en específico',
        '`-x` para excluir resultados comunes',
        '`--meme` para ver comandos meme',
        '`-m` o `--mod` para ver comandos de moderación',
        '`-p` o `--papa` para ver comandos de Papita con Puré',
        '`-h` o `--hourai` para ver comandos exclusivos de Hourai',
        '`-t` o `--todo` para ver comandos inhabilitados'
    ],
    callx: '<comando?>',
    
	async execute(message, args) {
        const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
        let fex = false;
        let fmeme = false;
        let fmod = false;
        let fpapa = false;
        let fhourai = false;
        let fall = false;
        let search = 'n';
        args.map(arg => {
            if(arg.startsWith('--'))
                switch(arg.slice(2)) {
                case 'meme': fmeme = true; break;
                case 'mod': fmod = true; break;
                case 'papa': fpapa = true; break;
                case 'hourai': fhourai = true; break;
                case 'todo': fall = true; break;
                }
            else if(arg.startsWith('-')) {
                for(c of arg.slice(1))
                    switch(c) {
                    case 'x': fex = true; break;
                    case 'm': fmod = true; break;
                    case 'p': fpapa = true; break;
                    case 'h': fhourai = true; break;
                    case 't': fall = true; break;
                    }
            } else if(search === 'n')
                search = arg;
        });

        let list = {
            'name': [],
            'aliases': [],
            'flags': [],
            'options': [],
            'desc': '',
            'callx': ''
        };
        let item = 0;
        
        for(const file of cfiles) {
            const command = require(`../../commands/Pure/${file}`);
            if(search === 'n') {
                if(command.flags !== undefined) {
                    if(!command.flags.includes('guide')) {
                        const cmeme = fmeme? true : !command.flags.includes('meme');
                        const cmod = (fmod && message.member.permissions.has('MANAGE_ROLES'))? true : !command.flags.includes('mod');
                        const cpapa = (fpapa && message.author.id === '423129757954211880')? true : !command.flags.includes('papa');
                        const chourai = (fhourai && message.channel.guild.id === serverid.hourai)? true : !command.flags.includes('hourai');
                        const cex = fex? !command.flags.includes('common') : true;
                        const call = fall? true : (!command.flags.includes('maintenance') && !command.flags.includes('outdated'));
                    
                        if(cmeme && cmod && cpapa && chourai && cex && call) {
                            list.name[item] = command.name;
                            item++;
                        }
                    }
                } else {
                    list.name[item] = command.name;
                    item++;
                }
            } else if(search === command.name || ((command.aliases !== undefined)?command.aliases.some(alias => alias === search):false)) {
                list.name[0] = command.name;
                list.aliases = command.aliases;
                list.flags = command.flags;
                list.options = command.options;
                list.desc = command.desc;
                list.callx = command.callx;
                break;
            }
        }

        const aurl = message.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 });
        let embed = new MessageEmbed().setColor('#608bf3');
        if(search === 'n') {
            embed.setAuthor('Lista de comandos', aurl)
            .addField('Comandos: ejemplos de uso', `\`${p_pure}ayuda -xmph --meme\`\n\`${p_pure}avatar @Usuario\`\n\`${p_pure}dados 5d6\``)
            .addField(`Usa \`${p_pure}ayuda <comando>\` para más información sobre un comando`, (list.name.length > 0)?list.name.map(item => `\`${item}\``).join(', '):'Sin resultados (remueve la bandera -x si no la necesitas y asegúrate de tener los permisos necesarios para realizar tu búsqueda).')
            .addField(`Guía introductoria`, `Usa \`${p_pure}ayuda g-indice\` para ver la página de índice de la guía introductoria de Bot de Puré`);
        } else {
            const title = s => {
                s = (s.startsWith('g-'))?`${s.slice(2)} (Página de Guía)`:s;
                s = (list.flags.includes('mod'))?`${s} (Mod)`:s;
                s = (list.flags.includes('papa'))?`${s.slice(5)} (Papita con Puré)`:s;
                return `${s[0].toUpperCase()}${s.slice(1)}`;
            };
            if(list.name.length > 0) {
                const arrayExists = arr => arr !== undefined && arr.some(it => it.length > 0);
                const flagsExist = arrayExists(list.flags);
                embed.setAuthor(title(list.name[0]), aurl)
                    .setFooter(`Usa "${p_pure}ayuda g-indice" para aprender más sobre comandos`)
                    .addField('Nombre', `\`${list.name[0]}\``, true)
                    .addField('Alias', arrayExists(list.aliases)?(list.aliases.map(i => `\`${i}\``).join(', ')):':label: Sin alias', true)
                    .addField('Descripción', (list.desc !== undefined && list.desc.length > 0)?list.desc:':warning: Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde');
                if(!flagsExist || !list.flags.some(flag => flag === 'guide'))
                    embed.addField('Llamado', `\`${p_pure}${list.name[0]}${(list.callx !== undefined)?` ${list.callx}`:''}\``, true)
                        .addField(`Opciones (\`${p_pure}x -x --xxx <x>\`)`, arrayExists(list.options)?list.options.join('\n'):':abacus: Sin opciones', true)
                        .addField('Identificadores', flagsExist?(list.flags.map(i => `\`${i}\``).join(', ').toUpperCase()):':question: Este comando no tiene identificadores por ahora');
            } else
                embed.setAuthor('Sin resultados', aurl)
                    .addField('No se ha encontrado ningún comando con este nombre', `Utiliza \`${p_pure}ayuda\` para ver una lista de comandos disponibles y luego usa \`${p_pure}comando <comando>\` para ver un comando en específico`);
        }
        
        message.channel.send({ embeds: [embed] });
    },
};