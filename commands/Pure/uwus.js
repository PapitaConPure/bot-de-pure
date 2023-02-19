const { MessageEmbed, Collection } = require('discord.js');
const { paginateRaw } = require('../../func');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const options = new CommandOptionsManager()
    .addParam('tiempo', 'NUMBER', 'para establecer la duración del evento, en segundos', { optional: true });
const flags = new CommandMetaFlagsManager().add(
    'MEME',
    'GAME',
    'CHAOS',
);
const command = new CommandManager('uwus', flags)
    .setBriefDescription('Inicia un evento UwU en el canal')
    .setLongDescription(
        'Inicia un __evento UwU__, que puede durar el tiempo que se desee hasta 2 horas (7200s).',
        '*Evento UwU:* la persona que más __mensajes que contienen "uwu"s__ envíe para cuando el tiempo acabe, ganará. Ganar no tiene ninún beneficio pero ganar no es perder y perder es feo (umu).',
        'Al finalizar el evento, se muestran los resultados y se borran todos los mensajes con "uwu" enviados durante el mismo.',
    )
    .setOptions(options)
    .setExecution(async (request, args) => {
        const secs = isNaN(args[0]) ? 30 : Math.max(0.1, Math.min(args[0], 3600 * 2));
        
        let uwuUsers = {};
        let lastUwu;
        const filter = m => (m.content.toLowerCase().indexOf('uwu') !== -1 && !m.author.bot) || (m.content.toLowerCase() === 'antiuwu' && m.author.id === request.author.id);
        const coll = request.channel.createMessageCollector({ filter: filter, time: (secs * 1000) });

        coll.on('collect', m => {
            const userId = (m.author ?? m.user).id;
            if(m.content === 'antiuwu') 
                return coll.stop();
            
            uwuUsers[userId] ??= 0;
            uwuUsers[userId] += 1;
            lastUwu = m.author ?? m.user;
        });

        coll.on('end', collected => {
            let bestId;
            let max = 0;
            for(const [ uid, count ] of Object.entries(uwuUsers)) {
                if(count >= max) {
                    bestId = uid;
                    max = count;
                }
            }

            const collectedSlices = paginateRaw(collected, 100);
            // console.log(collectedSlices);
            
            const embed = new MessageEmbed()
                .setColor('ffbbbb')
                .setTitle('Evento UWU finalizado')
                .addFields(
                    {
                        name: 'Estadísticas',
                        value: `**UWUs totales:** ${collected.size}\n**UWUs por segundo:** ${collected.size / secs}`,
                        inline: true,
                    },
                    {
                        name: 'Persona que envió...',
                        value: `**Más UWUs:** ${bestId ? `<@${bestId}>` : 'nadie umu'}\n**Último UWU:** ${lastUwu ?? 'nadie umu'}`,
                        inline: true,
                    },
                );
            
            return Promise.all([
                ...collectedSlices.map(slice => {
                    const sliceCollection = new Collection(slice);
                    // console.log(sliceCollection);
                    return request.channel.bulkDelete(sliceCollection);
                }),
                request.reply({ embeds: [embed] }),
            ]).catch(console.error);
        });

        const user = request.author ?? request.user;

        const embed = new MessageEmbed()
            .setColor('ffbbbb')
            .setTitle('Evento UWU')
            .addFields(
                {
                    name: 'UWU',
                    value: 'Envía **uwu** para sumar un **uwu**.',
                },
                {
                    name: 'Duración del evento',
                    value: `**${secs}** segundos.`,
                },
            )
            .setAuthor({ name: `Evento iniciado por ${user.username}`, iconURL: user.avatarURL() });
        
        return request.reply({ embeds: [embed] });
    });

module.exports = command;