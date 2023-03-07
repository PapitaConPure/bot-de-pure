const { readdirSync } = require('fs'); //Integrar operaciones sistema de archivos de consola
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { serverid, tenshiColor, peopleid } = require('../../localdata/config.json'); //Variables globales
const { isNotModerator } = require('../../func');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
    .addParam('comando', 'TEXT',                           'para ver ayuda en un comando en específico', { optional: true })
    .addFlag('x', ['exclusivo', 'exclusiva', 'exclusive'], 'para realizar una búsqueda exclusiva')
    .addFlag([],  'meme',                                  'para ver comandos meme')
    .addFlag('m', 'mod',                                   'para ver comandos de moderación')
    .addFlag('p', 'papa',                                  'para ver comandos de Papita con Puré')
    .addFlag('h', 'hourai',                                'para ver comandos exclusivos de Hourai Doll')
    .addFlag('t', 'todo',                                  'para ver comandos inhabilitados');

const command = new CommandManager('ayuda', flags)
    .setAliases('comandos', 'acciones', 'help', 'commands', 'h')
    .setBriefDescription('Muestra una lista de comandos o un comando en detalle')
    .setLongDescription(
        'Muestra una lista de comandos deseada o un comando en detalle',
        'Al buscar listas de comandos, se filtran los comandos que tienen al menos uno de los `--identificadores` buscados',
        'Puedes hacer una búsqueda `--exclusiva` si solo quieres los comandos que tengan **todos** los identificadores buscados',
    )
    .setOptions(options)
    .setExecution(async (request, args, isSlash) => {
        const filterExclusive = options.fetchFlag(args, 'exclusivo', { callback: true });
        const filterAll =       options.fetchFlag(args, 'todo',      { callback: true });

        //Crear máscaras de autorización para listar un comando según sus flags
        const blockAuth = [
            isNotModerator(request.member) && 'MOD',
            (request.author ?? request.user).id !== peopleid.papita && 'PAPA',
            request.guild.id !== serverid.hourai && 'HOURAI',
        ].filter(f => f);
        
        const filters = ['meme', 'mod', 'papa', 'hourai']
            .filter(src => options.fetchFlag(args, src, { callback: src }))
            .map(f => f.toUpperCase());
        
        let search = isSlash ? args.getString('comando') : (args[0] ?? null);
        let list = [];
        const embeds = [];
        const components = [];
        const guildPrefix = p_pure(request.guildId).raw;
        const helpCommand = `${guildPrefix}${module.exports.name}`;
        
        //Análisis de comandos
        const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
        for(const file of cfiles) {
            const commandFile = require(`../../commands/Pure/${file}`);
            /**@type {CommandManager}*/
            const command = commandFile.command ?? commandFile;
            const { name, aliases, flags } = command;
            
            if(!search) {
                const filtered = (() => {
                    if(flags.has('GUIDE')) return false;
                    if(filterAll) return true;
                    if(flags.any('MAINTENANCE', 'OUTDATED')
                    || blockAuth.some(f => flags.has(f)))
                        return false;
                    if(!filters.length) return true;
                    return filterExclusive
                        ? filters.every(f => flags.has(f))
                        : filters.some(f => flags.has(f));
                })();
                if(filtered)
                    list.push(name);
            } else if([name, ...(aliases || [])].includes(search)) {
                const title = s => {
                    pfi = s.indexOf('-') + 1;
                    s = (flags.has('GUIDE')) ? `${s.slice(pfi)} (Página de Guía)`  : s;
                    s = (flags.has('MOD'))   ? `${s} (Mod)`                        : s;
                    s = (flags.has('PAPA'))  ? `${s.slice(pfi)} (Papita con Puré)` : s;
                    return `${s[0].toUpperCase()}${s.slice(1)}`;
                };
                const isNotGuidePage = !(flags.has('GUIDE'));
                const listExists = l => l?.[0]?.length;

                //Embed de metadatos
                embeds.push(
                    new MessageEmbed()
                        .setColor(0x608bf3)
                        .setAuthor({ name: title(name), iconURL: request.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 }) })
                        .addFields(
                            { name: 'Nombre', value: `\`${name}\``, inline: true },
                            {
                                name: 'Alias',
                                value: listExists(aliases)
                                    ? (aliases.map(i => `\`${i}\``).join(', '))
                                    : ':label: Sin alias',
                                inline: true,
                            },
                            { name: 'Identificadores', value: flags.values.map(f => `\`${f}\``).join(', '), inline: true },
                        )
                );
                
                //Embed de información
                embeds.push(new EmbedBuilder()
                    .setColor(0xbf94e4)
                    .addFields({
                        name: 'Descripción',
                        value: command.desc || ':warning: Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde',
                    })
                );
                if(isNotGuidePage)
                    embeds[1].addFields(
                        { name: 'Llamado', value: `\`${guildPrefix}${command.name}${command.callx ? ` ${command.callx}` : ''}\`` },
                        { name: 'Opciones', value: command.options?.display || ':abacus: Sin opciones' },
                    );

                components.push(new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId('ayuda_porfavorayuden')
                            .setLabel('Muéstrame cómo')
                            .setStyle(ButtonStyle.Primary)
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
                .setAuthor({ name: 'Lista de comandos', iconURL: request.client.user.avatarURL({ format: 'png', dynamic: true, size: 512 }) })
                .addFields(
                    {
                        name: 'Comandos: ejemplos de uso',
                        value: `\`${helpCommand} -xmph --meme\`\n\`${guildPrefix}avatar @Usuario\`\n\`${guildPrefix}dados 5d6\``,
                    },
                    {
                        name: `Usa \`${helpCommand} <comando>\` para más información sobre un comando`,
                        value: listdisplay,
                    },
                    {
                        name: 'Emotes rápidos',
                        value: `"Me gustan los emotes de **&perrito** y **&uwu**"`,
                    },
                    {
                        name: `Guía introductoria`,
                        value: `Usa \`${helpCommand} g-indice\` para ver la página de índice de la guía introductoria de Bot de Puré`,
                    },
                )
            );
        } else {
            if(!embeds.length)
                embeds.push(new MessageEmbed()
                    .setColor(0xe44545)
                    .setAuthor({ name: 'Sin resultados' })
                    .addFields({
                        name: 'No se ha encontrado ningún comando con este nombre',
                        value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}comando <comando>\` para ver un comando en específico`,
                    })
                );
            embeds[embeds.length - 1].setFooter({ text: `Usa "${helpCommand} ${require('./g-indice.js').name}" para aprender más sobre comandos` });
        }
        return request.reply({
            embeds: embeds,
            components,
        });
    });

module.exports = command;