const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { serverid } = require('../../localdata/config.json'); //Variables globales
const { paginate, fetchArrows } = require('../../func');

module.exports = {
	name: 'emotes',
	aliases: [
		'emojis', 'emote', 'emoji',
		'emt'
	],
    desc: 'Muestra una lista paginada de emotes a mi disposición',
    flags: [
        'common'
    ],
	
	async execute(message, args) {
		const guilds = message.client.guilds.cache;
		let emotes = [];
		{
			const slot1Coll = guilds.get(serverid.slot1).emojis.cache.values();
			const slot2Coll = guilds.get(serverid.slot2).emojis.cache.values();
			const slot3Coll = guilds.get(serverid.slot3).emojis.cache.values();
			emotes = [...slot1Coll, ...slot2Coll, ...slot3Coll].sort();
		}
		/*emotes = emotes.map((e, i) => { return (i % pagemax === 0)?emotes.slice(i, i + pagemax):null; }).filter(e => e);
		emotes = emotes.map(page => page.map(e => `\`${e.name}${' '.repeat(24 - e.name.length)}\` <:${e.name}:${e.id}>`).join('\n'));*/
		emotes = paginate(emotes);
		let page = 0;
		const content = '**Oe mira po, emotes** <:yumou:708158159180660748>\n';
		const embed = new MessageEmbed()
			.setColor('#fecb4c')
			.setTitle('Emotes')

			.addField(`${'Nombre\`'.padEnd(24)}\`Emote`, emotes[0])

			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
			.setFooter(`Reacciona a las flechas debajo para cambiar de página`);

		const arrows = fetchArrows(message.client.emojis.cache);
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		message.channel.send({ content: content, embeds: [embed] }).then(sent => {
			sent.react(arrows[0])
				.then(() => sent.react(arrows[1]));
			
			const collector = sent.createReactionCollector({ filter: filter, time: 8 * 60 * 1000 });
			collector.on('collect', reaction => {
				if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):(emotes.length - 1);
				else page = (page < (emotes.length - 1))?(page + 1):0;
				embed.fields[0].value = emotes[page];
				embed.setFooter(`Página ${page + 1}/${Math.ceil(emotes.length)}`);
				sent.edit({ content: content, embeds: [embed]});
			});
		});
    },
};