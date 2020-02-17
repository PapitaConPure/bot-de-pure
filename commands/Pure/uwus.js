const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'uwus',
	execute(message, args) {
        let secs;
        if(args.size) secs = args[0];
        else secs = 30;
        const Embed = new Discord.RichEmbed()
            .setColor('ffbbbb')
            .setTitle('Evento UWU')
            .addField('UWU', 'Envía **uwu** para sumar un **uwu**.')
            .addField('Duración del evento', `**${secs}** segundos.`)
            .setAuthor(`Evento iniciado por ${message.author.username}`, message.author.avatarURL);
        message.channel.send(Embed).then(sent => {
            const filter = m => m.content.toLowerCase().indexOf('uwu') !== -1 && !m.author.bot;
            let uwusers = [];
			coll = sent.channel.createMessageCollector(filter, { time: (secs * 1000) });
            coll.on('collect', m => {
                if(typeof uwusers[m.author.id] === undefined) uwusers[m.author.id] = 1;
                uwusers[m.author.id]++;
            });
			coll.on('end', collected => {
                let mvp;
                if(!arr.length) mvp = -1;
                else {
                    let max = 0, maxid;
                    uwusers.forEach((uwuser, iduwu) => {
                        if(uwuser >= max) {
                            max = uwuser;
                            maxid = iduwu;
                        }
                    });
                    mvp = iduwu;
                }
                message.channel.send(
                    `**UWUs totales:** ${collected.size}\n` +
                    `**UWUs por segundo:** ${collected.size / secs}\n` +
                    `**Persona que envió más uwus: ${(mvp !== -1)?`${Client.fetchUser(mvp).username}`:'nadie umu'}**`
                );
            });
        });
    },
};