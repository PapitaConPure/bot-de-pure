const { MessageEmbed } = require('discord.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
    .addParam('tiempo', 'NUMBER', 'para establecer la duración del evento, en segundos', { optional: true });

module.exports = {
	name: 'uwus',
    desc: 'Inicia un __evento UwU__, que puede durar el tiempo que se desee hasta 2 horas (7200s).\n' +
        '*Evento UwU:* la persona que más __mensajes que contienen "uwu"s__ envíe para cuando el tiempo acabe, ganará. Ganar no tiene ninún beneficio pero ganar no es perder y perder es feo (umu).\n' +
        'Al finalizar el evento, se muestran los resultados y se borran todos los mensajes con "uwu" enviados durante el mismo.',
    flags: [
        'meme',
        'game',
        'chaos',
    ],
    options,
    callx: '<tiempo?>',
    experimental: true,
	
    /**
     * 
     * @param {import('../Commons/typings').CommandRequest} request 
     * @param {import('../Commons/typings').CommandOptions} args 
     * @param {Boolean} isSlash 
     * @returns 
     */
	async execute(request, args, isSlash = false) {
        const secs = isNaN(args[0]) ? 30 : Math.max(0.1, Math.min(args[0], 3600 * 2));
        
        let uwuUsers = {};
        let lastUwu;
        const filter = m => (m.content.toLowerCase().indexOf('uwu') !== -1 && !m.author.bot) || (m.content.toLowerCase() === 'antiuwu' && m.author.id === request.author.id);
        coll = request.channel.createMessageCollector({ filter: filter, time: (secs * 1000) });

        coll.on('collect', m => {
            const userId = (m.author ?? m.user).id;
            if(m.content === 'antiuwu') 
                return coll.stop();
            
            uwuUsers[userId] = (uwuUsers[userId] ?? 0) + 1;
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
            
            const embed = new MessageEmbed()
                .setColor('ffbbbb')
                .setTitle('Evento UWU finalizado')
                .addField('Estadísticas', `**UWUs totales:** ${collected.size}\n**UWUs por segundo:** ${collected.size / secs}`, true)
                .addField('Persona que envió...', `**Más UWUs:** <@${bestId ?? 'nadie umu'}>\n**Último UWU:** ${lastUwu ?? 'nadie umu'}`, true);

            return Promise.all([
                request.channel.bulkDelete(collected),
                request.channel.send({ embeds: [embed] }),
            ]);
        });

        const embed = new MessageEmbed()
            .setColor('ffbbbb')
            .setTitle('Evento UWU')
            .addField('UWU', 'Envía **uwu** para sumar un **uwu**.')
            .addField('Duración del evento', `**${secs}** segundos.`)
            .setAuthor({ name: `Evento iniciado por ${request.author.username}`, iconURL: request.author.avatarURL() });
        
        return request.reply({ embeds: [embed] });
    },
};