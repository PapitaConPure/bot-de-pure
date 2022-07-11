const { readdirSync } = require('fs'); //Integrar operaciones sistema de archivos de consola
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { serverid, tenshiColor } = require('../../localdata/config.json'); //Variables globales
const { fetchFlag } = require('../../func');
const { p_pure } = require('../../localdata/customization/prefixes.js');
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
    experimental: true,

	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
        const filterExclusive =  isSlash ? options.fetchFlag(args, 'exclusivo', { callback: true }) : fetchFlag(args, { ...options.flags.get('exclusivo').structure, callback: true });
        const filterAll =        isSlash ? options.fetchFlag(args, 'todo',      { callback: true }) : fetchFlag(args, { ...options.flags.get('todo').structure,      callback: true });
        const filterAuth = {
            mod: request.member.permissions.has('MANAGE_ROLES'),
            papa: (request.author ?? request.user).id === '423129757954211880',
            hourai: request.guild.id === serverid.hourai,
        };
        const filters = ['meme', 'mod', 'papa', 'hourai']
            .map(src => isSlash ? options.fetchFlag(args, src, { callback: src }) : fetchFlag(args, { ...options.flags.get(src).structure, callback: src }))
            .filter(s => s);
        
        let search = isSlash ? args.getString('comando') : (args[0] ?? null);
        let list = [];
        const embeds = [];
        const components = [];
        const avatarUrl = request.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 });
        const guildPrefix = p_pure(request.guildId).raw;
        const helpCommand = `${guildPrefix}${module.exports.name}`;
        
        //Análisis de comandos
        const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
        for(const file of cfiles) {
            const command = require(`../../commands/Pure/${file}`);
            const { name, aliases, flags } = command;
            
            if(!search) {
                const filtered = (() => {
                    if(!flags) return true;
                    if(flags.includes('guide')) return false;
                    if(filterAll) return true;
                    if(['maintenance', 'outdated'].some(f => flags.includes(f))
                    || (!flags.every(f => (filterAuth[f] === undefined || filterAuth[f]))))
                        return false;
                    if(!filters.length) return true;
                    return filterExclusive
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
                const isNotGuidePage = !(flags?.includes('guide'));
                const listExists = l => l?.[0]?.length;

                //Embed de metadatos
                embeds.push(new MessageEmbed()
                    .setColor('#608bf3')
                    .setAuthor({ name: title(name), iconURL: avatarUrl})
                    .addField('Nombre', `\`${name}\``, true)
                    .addField('Alias', listExists(aliases)
                        ? (aliases.map(i => `\`${i}\``).join(', '))
                        : ':label: Sin alias', true)
                );
                if(isNotGuidePage)
                    embeds[0].addField('Identificadores', listExists(flags)
                        ? flags.map(i => `\`${i}\``).join(', ').toUpperCase()
                        : ':question: Este comando no tiene identificadores por ahora', true);
                
                //Embed de información
                embeds.push(new MessageEmbed()
                    .setColor('#bf94e4 ')
                    .addField('Descripción', command.desc?.length
                        ? command.desc
                        : ':warning: Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde')
                );
                if(isNotGuidePage)
                    embeds[1].addField('Llamado', `\`${guildPrefix}${command.name}${command.callx ? ` ${command.callx}` : ''}\``)
                        .addField('Opciones', command.options
                            ? command.options.display
                            : ':abacus: Sin opciones');

                components.push(new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setCustomId('ayuda_porfavorayuden')
                            .setLabel('Muéstrame cómo')
                            .setStyle('PRIMARY')
                            .setEmoji('📖')
                            .setDisabled(true),
                    ])
                );
                break;
            }
        }

        if(!search) {
            const listdisplay = list.length
                ? list.map(item => `\`${item}\``).join(', ')
                : 'Sin resultados (remueve la bandera -x si no la necesitas y asegúrate de tener los permisos necesarios para buscar un cierto identificador)';
            embeds.push(new MessageEmbed()
                .setColor(tenshiColor)
                .setAuthor({ name: 'Lista de comandos', iconURL: avatarUrl })
                .addField('Comandos: ejemplos de uso', `\`${helpCommand} -xmph --meme\`\n\`${guildPrefix}avatar @Usuario\`\n\`${guildPrefix}dados 5d6\``)
                .addField(`Usa \`${helpCommand} <comando>\` para más información sobre un comando`, listdisplay)
                .addField('Emotes rápidos', `"Me gustan los emotes de **&perrito** y **&uwu**"`)
                .addField(`Guía introductoria`, `Usa \`${helpCommand} g-indice\` para ver la página de índice de la guía introductoria de Bot de Puré`)
            );
        } else {
            if(!embeds.length)
                embeds.push(new MessageEmbed()
                    .setColor('#e44545')
                    .setAuthor({ name: 'Sin resultados' })
                    .addField('No se ha encontrado ningún comando con este nombre',
                        `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}comando <comando>\` para ver un comando en específico`)
                );
            embeds[embeds.length - 1].setFooter({ text: `Usa "${helpCommand} ${require('./g-indice.js').name}" para aprender más sobre comandos` });
        }
        return request.reply({
            embeds: embeds,
            components: components,
        });
    },
};