const { readdirSync } = require('fs'); //Integrar operaciones sistema de archivos de consola
const { MessageEmbed, Message } = require('discord.js');
const { serverid } = require('../../localdata/config.json'); //Variables globales
const { fetchFlag } = require('../../func');
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
    .addParam('comando', 'TEXT',                           'para ver ayuda en un comando en específico', { optional: true })
    .addFlag('x', ['exclusivo', 'exclusiva', 'exclusive'], 'para realizar una búsqueda exclusiva')
    .addFlag([],  'meme',                                  'para ver comandos meme')
    .addFlag('m', 'mod',                                   'para ver comandos de moderación')
    .addFlag('p', 'papa',                                  'para ver comandos de Papita con Puré')
    .addFlag('h', 'hourai',                                'para ver comandos exclusivos de Hourai Doll')
    .addFlag('t', 'todo',                                  'para ver comandos inhabilitados');

module.exports = {
	name: 'ayuda',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
    brief: 'Muestra una lista de comandos o un comando en detalle.',
    desc: 'Muestra una lista de comandos deseada o un comando en detalle.\n' +
        'Al buscar listas de comandos, se filtran los comandos que tienen al menos uno de los `--identificadores` buscados\n' +
        'Puedes hacer una búsqueda `--exclusiva` si solo quieres los comandos que tengan **todos** los identificadores buscados',
    flags: [
        'common'
    ],
    options,
    callx: '<comando?>',
    
	async execute({ client, channel, author, member, guildId }, args) {
        const fex = fetchFlag(args, { short: ['x'], long: ['exclusivo', 'exclusiva', 'exclusive'], callback: true });
        const fall = fetchFlag(args, { short: ['t'], long: ['todo'], callback: true });
        const auth = {
            mod: member.permissions.has('MANAGE_ROLES'),
            papa: author.id === '423129757954211880',
            hourai: channel.guild.id === serverid.hourai
        };
        const filters = [
            fetchFlag(args, {               long: ['meme'],   callback: 'meme'   }),
            fetchFlag(args, { short: ['m'], long: ['mod'],    callback: 'mod'    }),
            fetchFlag(args, { short: ['p'], long: ['papa'],   callback: 'papa'   }),
            fetchFlag(args, { short: ['h'], long: ['hourai'], callback: 'hourai' })
        ].filter(s => s);
        
        let search = args.length ? args[0] : null;

        let list = [];
        const embed = new MessageEmbed().setColor('#608bf3');
        const aurl = client.user.avatarURL({ format: 'png', dynamic: true, size: 512 });
        const pfr = p_pure(guildId).raw;
        const hcmd = `${pfr}${module.exports.name}`;
        
        //Análisis de comandos
        const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
        for(const file of cfiles) {
            const command = require(`../../commands/Pure/${file}`);
            const { name, aliases, flags } = command;
            
            if(!search) {
                const filtered = (() => {
                    if(!flags) return true;
                    if(flags.includes('guide')) return false;
                    if(fall) return true;
                    if(['maintenance', 'outdated'].some(f => flags.includes(f))
                    || (!flags.every(f => (auth[f] === undefined || auth[f]))))
                        return false;
                    if(!filters.length) return true;
                    return fex
                        ? filters.every(f => flags.includes(f))
                        : filters.some(f => flags.includes(f));
                })();
                if(filtered)
                    list.push(name);
            } else if([name, ...(aliases || [])].includes(search)) {
                const title = s => {
                    pfi = s.indexOf('-') + 1;
                    s = (flags.includes('guide')) ? `${s.slice(pfi)} (Página de Guía)`  : s;
                    s = (flags.includes('mod'))   ? `${s} (Mod)`                        : s;
                    s = (flags.includes('papa'))  ? `${s.slice(pfi)} (Papita con Puré)` : s;
                    return `${s[0].toUpperCase()}${s.slice(1)}`;
                };
                const listExists = l => l && l[0] && l[0].length;

                embed.setAuthor(title(name), aurl)
                    .addField('Nombre', `\`${name}\``, true)
                    .addField('Alias', listExists(aliases)
                        ? (aliases.map(i => `\`${i}\``).join(', '))
                        : ':label: Sin alias', true)
                    .addField('Descripción', (command.desc !== undefined && command.desc.length > 0)
                        ? command.desc
                        : ':warning: Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde');
                
                if(flags ? !flags.includes('guide') : true)
                    embed.addField('Llamado', `\`${pfr}${command.name}${command.callx ? ` ${command.callx}` : ''}\``, true)
                        .addField(`Opciones (\`${pfr}x -x --xxx <x>\`)`, command.options
                            ? command.options.display
                            : ':abacus: Sin opciones', true)
                        .addField('Identificadores', listExists(flags)
                            ? flags.map(i => `\`${i}\``).join(', ').toUpperCase()
                            : ':question: Este comando no tiene identificadores por ahora');
                break;
            }
        }

        if(!search) {
            const listdisplay = list.length
                ? list.map(item => `\`${item}\``).join(', ')
                : 'Sin resultados (remueve la bandera -x si no la necesitas y asegúrate de tener los permisos necesarios para buscar un cierto identificador)';
            embed.setAuthor('Lista de comandos', aurl)
                .addField('Comandos: ejemplos de uso', `\`${hcmd} -xmph --meme\`\n\`${pfr}avatar @Usuario\`\n\`${pfr}dados 5d6\``)
                .addField(`Usa \`${hcmd} <comando>\` para más información sobre un comando`, listdisplay)
                .addField('Emotes rápidos', `"Me gustan los emotes de **&perrito** y **&uwu**"`)
                .addField(`Guía introductoria`, `Usa \`${hcmd} g-indice\` para ver la página de índice de la guía introductoria de Bot de Puré`);
        } else {
            if(!embed.author)
                embed.setAuthor('Sin resultados', aurl)
                    .addField('No se ha encontrado ningún comando con este nombre', `Utiliza \`${hcmd}\` para ver una lista de comandos disponibles y luego usa \`${pfr}comando <comando>\` para ver un comando en específico`);
            embed.setFooter(`Usa "${hcmd} ${require('./g-indice.js').name}" para aprender más sobre comandos`);
        }
        channel.send({ embeds: [embed] });
    },
};