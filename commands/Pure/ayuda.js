const { readdirSync } = require('fs'); //Integrar operaciones sistema de archivos de consola
const { MessageEmbed } = require('discord.js');
const { p_pure, serverid } = require('../../localdata/config.json'); //Variables globales
const { stringify } = require('querystring');
const { fetchFlag } = require('../../func');

module.exports = {
	name: 'ayuda',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
    brief: 'Muestra una lista de comandos o un comando en detalle.',
    desc: 'Muestra una lista de comandos deseada o un comando en detalle.',
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
    
	async execute({ client, channel, author, member }, args) {
        const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js')); //Lectura de comandos de bot
        const fex = fetchFlag(args, { short: ['x'], callback: true });
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
        
        let fall = fetchFlag(args, { short: ['t'], long: ['todo'], callback: true });
        let search = args.length ? args[0] : null;

        let list = [];
        const embed = new MessageEmbed().setColor('#608bf3');
        const aurl = client.user.avatarURL({ format: 'png', dynamic: true, size: 512 });
        
        for(const file of cfiles) {
            const command = require(`../../commands/Pure/${file}`);
            const { name, aliases, flags } = command;
            
            if(!search) {
                let filtered = true;
                if(flags) {
                    filtered = !flags.includes('guide');
                    if(filtered) {
                        filtered = flags.every(f => (auth[f] === undefined || auth[f]));
                        if(filtered && filters.length)
                            filtered = flags.some(f => filters.includes(f));
                    }
                }
                if(filtered)
                    list.push(name);
            } else if([name, ...(aliases || [])].includes(search)) {
                const title = s => {
                    pfi = s.indexOf('-') + 1;
                    s = (list.flags.includes('guide')) ? `${s.slice(pfi)} (Página de Guía)`  : s;
                    s = (list.flags.includes('mod'))   ? `${s} (Mod)`                        : s;
                    s = (list.flags.includes('papa'))  ? `${s.slice(pfi)} (Papita con Puré)` : s;
                    return `${s[0].toUpperCase()}${s.slice(1)}`;
                };
                const listExists = l => l && l[0].length;

                embed.setAuthor(title(name), aurl)
                    .addField('Nombre', `\`${name}\``, true)
                    .addField('Alias', listExists(aliases)
                        ? (aliases.map(i => `\`${i}\``).join(', '))
                        : ':label: Sin alias', true)
                    .addField('Descripción', (cmdh.desc !== undefined && command.desc.length > 0)
                        ? command.desc
                        :':warning: Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde');
                
                if(flags ? !flags.includes('guide') : true)
                    embed.addField('Llamado', `\`${p_pure.raw}${command.name}${command.callx ? ` ${command.callx}` : ''}\``, true)
                        .addField(`Opciones (\`${p_pure.raw}x -x --xxx <x>\`)`, listExists(command.options)
                            ? command.options.join('\n')
                            : ':abacus: Sin opciones', true)
                        .addField('Identificadores', listExists(flags)
                            ? (flags.map(i => `\`${i}\``).join(', ').toUpperCase())
                            : ':question: Este comando no tiene identificadores por ahora');
                break;
            }
        }

        const pfr = p_pure.raw;
        const hcmd = `${pfr}${module.exports.name}`;
        if(!search)
            embed.setAuthor('Lista de comandos', aurl)
                .addField('Comandos: ejemplos de uso', `\`${hcmd} -xmph --meme\`\n\`${pfr}avatar @Usuario\`\n\`${pfr}dados 5d6\``)
                .addField(`Usa \`${hcmd} <comando>\` para más información sobre un comando`, (list.length > 0) ? list.map(item => `\`${item}\``).join(', '):'Sin resultados (remueve la bandera -x si no la necesitas y asegúrate de tener los permisos necesarios para realizar tu búsqueda)')
                .addField(`Guía introductoria`, `Usa \`${hcmd} g-indice\` para ver la página de índice de la guía introductoria de Bot de Puré`);
        else {
            if(!embed.author)
                embed.setAuthor('Sin resultados', aurl)
                    .addField('No se ha encontrado ningún comando con este nombre', `Utiliza \`${hcmd}\` para ver una lista de comandos disponibles y luego usa \`${pfr}comando <comando>\` para ver un comando en específico`);
            embed.setFooter(`Usa "${hcmd} ${require('./g-indice.js').name}" para aprender más sobre comandos`);
        }
        channel.send({ embeds: [embed] });
    },
};