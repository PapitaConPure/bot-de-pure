const Discord = require('discord.js'); //Integrar discord.js
const { Client, RichEmbed } = require('discord.js'); //Seguir integrando discord.js (?
const client = new Discord.Client(); //Cliente de bot
const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'uwus',
	execute(message, args) {
        let secs;
        if(args.length) secs = args[0];
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
                if(isNaN(uwusers[m.author.id])) uwusers[m.author.id] = 1;
                else uwusers[m.author.id]++;
                m.channel.send(`${m.author.id}: ${uwusers[m.author.id]}`);
            });
			coll.on('end', collected => {
                let mvp;
                if(uwusers.length) {
                let max = 0, maxid;
                    uwusers.forEach((uwuser, iduwu) => {
                        if(uwuser >= max) {
                            max = uwuser;
                            maxid = iduwu;
                        }
                    });
                    mvp = maxid;
                }
                message.channel.send(
                    `**UWUs totales:** ${collected.size}\n` +
                    `**UWUs por segundo:** ${collected.size / secs}\n` +
                    `**Persona que envió más uwus: ${(mvp !== -1)?`${client.fetchUser(mvp).username}`:'nadie umu'}**`
                );
            });
        });
    },
};