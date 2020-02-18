const Discord = require('discord.js'); //Integrar discord.js
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
            let uwusers = {}, ultimuwu;
			coll = sent.channel.createMessageCollector(filter, { time: (secs * 1000) });
            coll.on('collect', m => {
                if(!uwusers.hasOwnProperty(`${m.author.id}`)) { uwusers[m.author.id] = 1; }
                else uwusers[m.author.id]++;
                ultimuwu = m.author.id;
            });
			coll.on('end', collected => {
                let mvp;
                let auwus = Object.entries(uwusers);
                let max = 0, maxid = -1;
                for(let uwuser of auwus) {
                    console.log(`${uwuser[0]}: ${uwuser[1]}`);
                    if(uwuser[1] >= max) {
                        maxid = uwuser[0];
                        max = uwuser[1];
                        console.log(`Procesado ${uwuser[1]} de ${uwuser[0]}`);
                    }
                }
                mvp = maxid;
                console.log(mvp);
                message.channel.send(
                    `**UWUs totales:** ${collected.size}\n` +
                    `**UWUs por segundo:** ${collected.size / secs}\n` +
                    `**Persona que envió más UWUs:** ${(mvp !== -1)?`<@${mvp}>`:'nadie umu'}\n` +
                    `**Último UWU enviado por:** ${(mvp !== -1)?`<@${ultimuwu}>`:'nadie umu'}`
                );
            });
        });
    },
};