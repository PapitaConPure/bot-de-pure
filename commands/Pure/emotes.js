const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const axios = require('axios');

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
	
	execute(message, args) {
		const guilds = message.client.guilds.cache;
		let emotes = [];
		{
			const slot1Coll = guilds.get(global.serverid.slot1).emojis.cache;
			const slot2Coll = guilds.get(global.serverid.slot2).emojis.cache;
			const slot3Coll = guilds.get(global.serverid.slot3).emojis.cache;
			emotes = slot1Coll.concat(slot2Coll).concat(slot3Coll).array().sort();
		}
		const pagemax = 20;
		emotes = emotes.map((e, i) => { return (i % pagemax === 0)?emotes.slice(i, i + pagemax):null; }).filter(e => e);
		emotes = emotes.map(page => page.map(e => `\`${e.name}${' '.repeat(24 - e.name.length)}\` <:${e.name}:${e.id}>`).join('\n'));
		let page = 0;
		const embed = new Discord.MessageEmbed()
			.setColor('#fecb4c')
			.setTitle('Emotes')

			.addField('Lista de emotes', emotes[0])

			.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
			.setFooter(`Reacciona a las flechas debajo para cambiar de página`);

		message.channel.send('**Oe mira po, emotes** <:yumou:708158159180660748>\n');
		const arrows = [message.client.emojis.cache.get('681963688361590897'), message.client.emojis.cache.get('681963688411922460')];
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		message.channel.send(embed).then(sent => {
			sent.react(arrows[0])
				.then(() => sent.react(arrows[1]));
			const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
			collector.on('collect', reaction => {
				if(reaction.emoji.id === arrows[0].id) page = (page > 0)?(page - 1):(emotes.length - 1);
				else page = (page < (emotes.length - 1))?(page + 1):0;
				embed.fields[0].value = emotes[page];
				embed.setFooter(`Página ${page + 1}/${Math.ceil(emotes.length)}`);
				sent.edit(embed);
			});
		});
		
		//message.channel.send(emotes.map(emote => `<:${emote.name}:${emote.id}>`).join(' '));
    },
};