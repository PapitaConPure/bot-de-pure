const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { bot_status } = require('../../localdata/config.json'); //Variables globales
const ayuda = require('./ayuda.js'); //Variables globales
const { readdirSync } = require('fs'); //Para el contador de comandos
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { Stats } = require('../../localdata/models/stats');
const { improveNumber, isShortenedNumberString } = require('../../func');
const { CommandMetaFlagsManager } = require('../Commons/commands');

const { host, version, note, changelog, todo } = bot_status;
const cmsearch = new RegExp(`${p_pure().raw}[A-Za-zÁÉÍÓÚáéíóúÑñ0-9_.-]*`, 'g');
const ne = [ '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣' ];
const listFormat = (str, addIndex, guildId) => {
    let cmindex = 0;
    return str.replace(cmsearch, match => `${addIndex?`**[${cmindex++}]**`:''}\`${p_pure(guildId).raw}${match.slice(p_pure().raw.length)}\``);
};
const counterDisplay = (number) => {
    const numberString = improveNumber(number, true);
    if(isShortenedNumberString(numberString))
        return `${numberString} de`;
    return numberString;
}

module.exports = {
	name: 'estado',
    aliases: [
        'status', 'botstatus'
    ],
    desc: 'Muestra mi estado actual. Eso incluye versión, host, registro de cambios, cosas por hacer, etc',
    flags: new CommandMetaFlagsManager().add('COMMON'),
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
        const totalCommands = stats.commands.succeeded + stats.commands.failed;

        const embed = new MessageEmbed()
            .setColor('#608bf3')
            .setAuthor({ name: 'Estado del Bot', iconURL: request.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }) })
            .setThumbnail('https://i.imgur.com/HxTxjdL.png')
            .setFooter({ text: `Ofreciendo un total de ${cnt.cmds} comandos en ${cnt.guilds} servidores` })
            .addFields(
                { name: 'Creador', value: `Papita con Puré\n[423129757954211880]`, inline: true },
                { name: 'Host', value: (host === 'https://localhost/') ? 'https://heroku.com/' : 'localhost', inline: true },
                { name: 'Versión', value: `#️⃣ ${version.number}\n📜 ${version.name}`, inline: true },
                { name: 'Visión general', value: note },
                { name: 'Cambios', value: listFormat(clformat, true, request.guild.id) },
                { name: 'Lo que sigue', value: listFormat(tdformat, false, request.guild.id) },
                {
                    name: 'Estadísticas',
                    value: [
                        `🎦 ${counterDisplay(stats.read)} mensajes registrados`,
                        `⚙️ ${counterDisplay(totalCommands)} comandos procesados`,
                        `✅ ${counterDisplay(stats.commands.succeeded)} (${(stats.commands.succeeded / totalCommands * 100).toFixed(2)}%) ejecuciones de comando exitosas`,
                        `⚠️ ${counterDisplay(stats.commands.failed)} (${(stats.commands.failed / totalCommands * 100).toFixed(2)}%) ejecuciones de comando fallidas`,
                    ].join('\n'),
                },
            );

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