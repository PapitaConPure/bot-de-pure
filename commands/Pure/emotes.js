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
        'common',
		'maintenance'
    ],
    options: [

    ],
	
	execute(message, args) {
		/*message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con el comando p!emotes que hace que no se pueda ver ninguno de los emotes disponibles al utilizarlo.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;*/
		
		const guilds = message.client.guilds.cache;
		const slot1Coll = guilds.get(global.serverid.slot1).emojis.cache;
		const slot2Coll = guilds.get(global.serverid.slot2).emojis.cache;
		const emotes = slot1Coll.concat(slot2Coll).array();
		const listmax = 20;

		let Embed = [];
		let SelectedEmbed = 0;
		for(let i = 0; i < (emotes.length / listmax); i++) {
			let emolist = '';
			let namelist = '';
			for(let listrange = i * listmax; listrange < Math.min(i * listmax + listmax, emotes.length); listrange++) {
				const emote = emotes[listrange];
				emolist += `<:${emote.name}:${emote.id}>\n`;
				namelist += `${emote.name}\n`;
			}

			Embed[i] = new Discord.MessageEmbed()
				.setColor('#fecb4c')
				.setTitle('Emotes')

				.addField('Lista de emotes', `${emolist} ${namelist}`)

				.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
				.setFooter(`Página ${i + 1}/${Math.ceil(emotes.length / listmax)}`);
		}

		message.channel.send('**Oe mira po, emotes** <:yumou:708158159180660748>\n');
		const arrows = [message.client.emojis.cache.get('681963688361590897'), message.client.emojis.cache.get('681963688411922460')];
		const filter = (rc, user) => !user.bot && arrows.some(arrow => rc.emoji.id === arrow.id);
		message.channel.send(Embed[0]).then(sent => {
			sent.react(arrows[0])
				.then(() => sent.react(arrows[1]))
				.then(() => {
					const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
					collector.on('collect', reaction => {
						const maxpage = Math.floor(emotes.length / listmax);
						if(reaction.emoji.id === arrows[0].id) SelectedEmbed = (SelectedEmbed > 0)?(SelectedEmbed - 1):maxpage;
						else SelectedEmbed = (SelectedEmbed < maxpage)?(SelectedEmbed + 1):0;
						sent.edit(Embed[SelectedEmbed]);
					});
				});
		});
		
		//message.channel.send(emotes.map(emote => `<:${emote.name}:${emote.id}>`).join(' '));
    },
};