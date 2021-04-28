const Discord = require('discord.js'); //Integrar discord.js
const { bot_status, p_pure } = require('../../localdata/config.json'); //Variables globales
const ayuda = require('./ayuda.js'); //Variables globales
const { readdirSync } = require('fs'); //Para el contador de comandos

module.exports = {
	name: 'estado',
    aliases: [
        'status', 'botstatus'
    ],
    desc: 'Muestra mi estado actual. Eso incluye versión, host, registro de cambios, cosas por hacer, etc',
    flags: [
        'common'
    ],
	
	execute(message, args) {
        const { host, version, note, changelog, todo } = bot_status;
        const cmsearch = new RegExp(`${p_pure}\\w*`, 'g');
        let cmindex = 0;
        String.prototype.listformat = function(index) {
            return this.replace(cmsearch, match => `${index?`**[${cmindex++}]**`:''}\`${match}\``);
        };
        const clformat = changelog.map(item => `- ${item}`).join('\n');
        const tdformat = todo.map(item => `- ${item}`).join('\n');
        const ne = [ '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣' ];
        const cm = changelog.join().match(cmsearch);
        
        const embed = new Discord.MessageEmbed()
            .setColor('#608bf3')
            .setAuthor('Estado del Bot', message.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setThumbnail('https://i.imgur.com/HxTxjdL.png')
            .setFooter(`Ofreciendo un total de ${readdirSync('./commands/Pure').filter(file => file.endsWith('.js')).length} comandos`)
            .addField('Creador', `Papita con Puré\n[423129757954211880]`, true)
            .addField('Host', (host === 'https://localhost/')?'https://heroku.com/':'localhost', true)
            .addField('Versión', `:hash: ${version.number}\n:scroll: ${version.name}`, true)
            .addField('Visión general', note)
            .addField('Cambios', clformat.listformat(true))
            .addField('Lo que sigue', tdformat.listformat(false));
        String.prototype.listformat = null;

        const f = (r, u) => !u.bot;
        message.channel.send(embed).then(async m => {
            if(cm === null) return;
            Promise.all(cm.map(async (_, i) => m.react(ne[i])));
            const coll = m.createReactionCollector(f, { max: cm.length, time: 1000 * 60 * 2 });
            coll.on('collect', nc => {
                const i = ne.indexOf(nc.emoji.name);
                const search = cm[i].slice(2).slice(cm[i].indexOf('-') + 1);
                ayuda.execute(m, [ search ]);
            });
        });
    },
};