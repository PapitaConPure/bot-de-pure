const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { bot_status, p_pure } = require('../../localdata/config.json'); //Variables globales
const ayuda = require('./ayuda.js'); //Variables globales
const { readdirSync } = require('fs'); //Para el contador de comandos
const prefixget = require('../../localdata/prefixget');
const { Stats } = require('../../localdata/models/stats');
const { improveNumber } = require('../../func');

const { host, version, note, changelog, todo } = bot_status;
const cmsearch = new RegExp(`${p_pure.raw}[A-Za-zÁÉÍÓÚáéíóúÑñ0-9_.-]*`, 'g');
const ne = [ '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣' ];
function listFormat(str, addIndex, guildId) {
    let cmindex = 0;
    return str.replace(cmsearch, match => `${addIndex?`**[${cmindex++}]**`:''}\`${prefixget.p_pure(guildId).raw}${match.slice(p_pure.raw.length)}\``)
};

module.exports = {
	name: 'estado',
    aliases: [
        'status', 'botstatus'
    ],
    desc: 'Muestra mi estado actual. Eso incluye versión, host, registro de cambios, cosas por hacer, etc',
    flags: [
        'common'
    ],
    experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, _, isSlash = false) {
        const stats = (await Stats.findOne({})) || new Stats({ since: Date.now( )});
        const clformat = changelog.map(item => `- ${item}`).join('\n');
        const tdformat = todo.map(item => `- ${item}`).join('\n');
        const cm = changelog.join().match(cmsearch);
        const cnt = {
            cmds: readdirSync('./commands/Pure').filter(file => file.endsWith('.js')).length,
            guilds: request.client.guilds.cache.size
        }
        const embed = new MessageEmbed()
            .setColor('#608bf3')
            .setAuthor('Estado del Bot', request.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setThumbnail('https://i.imgur.com/HxTxjdL.png')
            .setFooter(`Ofreciendo un total de ${cnt.cmds} comandos en ${cnt.guilds} servidores`)
            .addField('Creador', `Papita con Puré\n[423129757954211880]`, true)
            .addField('Host', (host === 'https://localhost/')?'https://heroku.com/':'localhost', true)
            .addField('Versión', `#️⃣ ${version.number}\n📜 ${version.name}`, true)
            .addField('Visión general', note)
            .addField('Cambios', listFormat(clformat, true, request.guild.id))
            .addField('Lo que sigue', listFormat(tdformat, false, request.guild.id))
            .addField('Estadísticas',
                `🎦 ${improveNumber(stats.read, true)} mensajes registrados\n` +
                `✅ ${improveNumber(stats.commands.succeeded)} ejecuciones de comando exitosas\n` +
                `⚠️ ${improveNumber(stats.commands.failed)} ejecuciones de comando fallidas`);

        const sentquery = (await Promise.all([
            request.reply({ embeds: [embed] }),
            isSlash ? request.fetchReply() : null,
        ])).filter(sq => sq);
        const sent = sentquery.pop();
        if(cm === null) return;
        Promise.all(cm.map(async (_, i) => sent.react(ne[i])));
        const coll = sent.createReactionCollector({ filter: (_, u) => !u.bot, max: cm.length, time: 1000 * 60 * 2 });
        coll.on('collect', nc => {
            const i = ne.indexOf(nc.emoji.name);
            if(i < 0) return;
            const search = cm[i].slice(2);
            ayuda.execute(sent, [ search ]);
        });
    },
};