const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'uwus',
	execute(message, args) {
        message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con Embed.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;

        let secs;
        if(args.length) {
            if(!isNaN(args[0])) secs = Math.max(0.1, Math.min(args[0], 3600 * 2));
            else secs = 30;
        } else secs = 30;
        const Embed = new Discord.MessageEmbed()
            .setColor('ffbbbb')
            .setTitle('Evento UWU')
            .addField('UWU', 'Envía **uwu** para sumar un **uwu**.')
            .addField('Duración del evento', `**${secs}** segundos.`)
            .setAuthor(`Evento iniciado por ${message.author.username}`, message.author.avatarURL);
        message.channel.send(Embed).then(sent => {
            const filter = m => (m.content.toLowerCase().indexOf('uwu') !== -1 && !m.author.bot) || (m.content.toLowerCase() === 'antiuwu' && m.author.id === message.author.id);
            let uwusers = {}, ultimuwu;
			coll = sent.channel.createMessageCollector(filter, { time: (secs * 1000) });
            coll.on('collect', m => {
                if(m.content !== 'antiuwu') {
                    if(!uwusers.hasOwnProperty(`${m.author.id}`)) { uwusers[m.author.id] = 1; }
                    else uwusers[m.author.id]++;
                    ultimuwu = m.author.id;
                } else coll.stop();
            });
			coll.on('end', collected => {
                let mvp;
                let auwus = Object.entries(uwusers);
                let max = 0, maxid = -1;
                for(let uwuser of auwus) {
                    if(uwuser[1] >= max) {
                        maxid = uwuser[0];
                        max = uwuser[1];
                    }
                }
                collected.deleteAll();
                mvp = maxid;
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