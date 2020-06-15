const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'taton',
	aliases: [
		'perrito',
		'perritos'
	],
	execute(message, args) {
		const perritosopt = [
			'perrito',		'720736050305171456',
			'otirrep',		'720736059251753180',
			'od',			'720736065673232404',
			'do',			'720736087131291678',
			'cerca',		'720736097948401686',
			'muycerca',		'720736106768891924',
			'lejos',		'720736112909221950',
			'muylejos',		'720736124007481424',
			'invertido',	'720736131368485025',
			'dormido',		'720736140935692389',
			'pistola',		'720736152348262500',
			'sad',			'720736161441644654',
			'gorrito',		'720736171642060868',
			'gorra',		'720736179883999401',
			'almirante',	'720736189782556807',
			'detective',	'720736199727251536',
			'ban',			'720736213773975613',
			'helado',		'720736228710023279',
			'corona',		'720736247089332225',
			'payaso',		'720736264373928030',
			'enojado',		'720736264382447697',
			'policia',		'720736265070444615',
			'ladron',		'720736300449398794',
			'importado',	'720736309290860666',
			'peleador',		'721898701454442546',
			'doge',			'721973016455807017',
			'cheems',		'721973038555463741',
			'jugo',			'721976283080294420'
		];

		if(!args.length) {
			const randperrito = Math.floor(Math.random() * perritosopt.length / 2) * 2;

			message.channel.send(`<:${perritosopt[randperrito]}:${perritosopt[randperrito + 1]}>`);
		} else {
			if(args[0] === 'todo' || args[0] === 'everything' || args[0] === 'all') {
				let perritostr = '**Emote**\t**Nombre**\n';

				message.client.guilds.get('676251911850164255').emojis.map(emote => {
					if(perritosopt.some(perrito => perrito === emote.name))
						perritostr +=`<:${emote.name}:${emote.id}> \t\t${emote.name}\n`;
				});
				
				message.channel.send(perritostr);
			} else {
				let foundperrito = false;
				message.client.guilds.get('676251911850164255').emojis.map(emote => {
					if(!foundperrito) {
						if(emote.name.startsWith(args[0]) && perritosopt.some(perrito => perrito === emote.name)) {
							message.channel.send(`<:${emote.name}:${emote.id}>`);
							foundperrito = true;
						}
					}
				});
				
				message.channel.send(`<:${perritosopt[0]}:${perritosopt[1]}>`);
			}
		}
    },
};