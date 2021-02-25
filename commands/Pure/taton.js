const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'taton',
	aliases: [
		'perrito', 'pe'
	],
    desc: '',
    flags: [
        'meme'
    ],
	
	execute(message, args) {
		/*message.channel.send(
			'```\n' +
			'[REPORTE DE ESTADO DEL BOT]\n' +
			'Estoy investigando un error con los comandos con emotes personalizados.\n' +
			'~Papita con Puré\n' +
			'```'
		);
		return;*/

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
			'Bern',			'720736264373928030',
			'enojado',		'720736264382447697',
			'policia',		'720736265070444615',
			'ladron',		'720736300449398794',
			'importado',	'720736309290860666',
			'peleador',		'721898701454442546',
			'doge',			'721973016455807017',
			'cheems',		'721973038555463741',
			'jugo',			'721976283080294420',
			'Papita',		'722238533007310928',
			'mano',			'723753514463133758',
			'Mima',			'723753514672586822',
			'chad',			'723762055345209394',
			'Marisa',		'724738820242669629',
			'fumado',		'724750942842519624',
			'Megumin',		'724779168033800214',
			'Navi',			'724779176816672819',
			'Sansas',		'725535400654929930',
			'chocolatada',	'725535400692547654',
			'ZUN',			'729041785715818646',
			'cafe',			'739512946354421770',
			'mate',			'739514195372146789',
			'espiando',		'740392218707361863',
			'madera',		'746893446425346150',
			'Keiki',		'750494819419422860',
			'piola',		'751600554265804811',
			'jarra',		'751600554702143579',
			'Nazrin',		'773083665248026645',
			'Miyoi',		'795732689512300574'
		];

		if(!args.length) {
			const randperrito = Math.floor(Math.random() * perritosopt.length / 2) * 2;

			message.channel.send(`<:${perritosopt[randperrito]}:${perritosopt[randperrito + 1]}>`);
		} else {
			const todoslosperritos = ['perritos', 'todo', 'todos', 'lista', 'ayuda', 'everything', 'all', 'help'];
			const guilds = message.client.guilds.cache;
			const slot1Coll = guilds.get(global.serverid.slot1).emojis.cache;
			const slot2Coll = guilds.get(global.serverid.slot2).emojis.cache;
			let emotes = slot1Coll.concat(slot2Coll);

			if(todoslosperritos.includes(args[0].toLowerCase())) {
				const listmax = 10;
				emotes = emotes.filter(emote => { return perritosopt.some(perrito => perrito === emote.name); }).array();

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
						.setColor('#e4d0c9')
						.setTitle(`Perritos <:${perritosopt[0]}:${perritosopt[1]}>`)

						.addField('Emote', emolist, true)
						.addField('Nombre', namelist, true)

						.setAuthor(`Comando invocado por ${message.author.username}`, message.author.avatarURL())
						.setFooter(`Página de lista ${i + 1}/${Math.ceil(emotes.length / listmax)}`);
				}

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
			} else {
				let foundperrito = false;
				emotes.map(emote => {
					if(!foundperrito) {
						if(emote.name.toLowerCase().startsWith(args[0].toLowerCase()) && perritosopt.some(perrito => perrito === emote.name)) {
							message.channel.send(`<:${emote.name}:${emote.id}>`);
							foundperrito = true;
						}
					}
				});

				if(!foundperrito) message.channel.send(`<:${perritosopt[0]}:${perritosopt[1]}>`);
			}
		}
    },
};