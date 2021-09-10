const Discord = require('discord.js'); //Integrar discord.js
const { fetchFlag, fetchSentence } = require('../../func.js');

module.exports = {
	name: 'encuesta',
	aliases: [
		'votación', 'votacion', 'voto',
		'poll'
	],
	desc: 'Crea una encuesta con opciones\n' +
	'Crea una encuesta con `<opciones>` que comienzan y se separan con emotes. Los emotes serán lo que se usará para votar\n' +
	'Si así lo deseas, puedes adherir una `--pregunta` y delegar el `--canal` al cual enviar la encuesta\n' +
	'Debido a la naturaleza de las votaciones, no podrás editar ningún aspecto de la encuesta una vez ya esté enviada. Si cometes un error, bórrala y usa el comando nuevamente\n' +
	'Por defecto, el periodo de votación es un minuto. Puedes cambiarlo en `--horas`, `--minutos` y `--segundos`',
	flags: [
		'mod'
	],
	options: [
		'`<opciones (emt,txt)>` _(emote,texto [múltiple])_ para agregar una opción',
		'`-p <txt>` o `--pregunta <txt>` _(texto)_ para asignar una pregunta',
		'`-h <n>` o `--hora <n>` _(número)_ para añadir tiempo en horas',
		'`-m <n>` o `--minutos <n>` _(número)_ para añadir tiempo en minutos',
		'`-s <n>` o `--segundos <n>` _(número)_ para añadir tiempo en segundos'
	],
	callx: '<twitters(...)>',

	async execute(message, args) {
		if(!args.length) {
			message.channel.send({ content: ':warning: Necesitas ingresar al menos dos opciones' });
			return;
		}

		//Parámetros de comando
		let channel = fetchFlag(args, {
			property: true,
			short: [ 'c' ],
			long: [ 'canal', 'channel' ],
			callback: (x,i)=> {
				let cs = x[i];
				if(cs.startsWith('<#') && cs.endsWith('>'))
					cs = cs.slice(2, -1);
				return message.guild.channels.cache.find(c => c.name.toLowerCase().indexOf(cs) !== -1 || c.id === cs);
			},
		});
		if(channel === undefined) channel = message.channel;
		const question = fetchFlag(args, { property: true, short: ['p', 'q'], long: ['pregunta', 'question'], callback: fetchSentence });
		const intOrZero = (n) => {
			const parsed = parseInt(n);
			if(isNaN(parsed)) return 0;
			else return parsed;
		};
		const time = {
			h: fetchFlag(args, { property: true, short: ['h'], long: ['hora', 'horas'], callback: (x,i) => intOrZero(x[i]), fallback: 0 }),
			m: fetchFlag(args, { property: true, short: ['m'], long: ['minuto', 'minutos'], callback: (x,i) => intOrZero(x[i]), fallback: 0 }),
			s: fetchFlag(args, { property: true, short: ['s'], long: ['segundo', 'segundos'], callback: (x,i) => intOrZero(x[i]), fallback: 0 }),
			t: 0
		}
		if(!time.h && !time.m && !time.s)
			time.m = 1;
		time.t = Object.values(time).slice(0, -1).reduce((a, b) => a * 60 + b);
		if(time.t > 4 * 3600) {
			message.channel.send(':warning: El periodo de votación no puede ser mayor a 4 horas');
			return;
		}
		
		//Acción de comando
		const div = 10;
		if(!args.length) {
			message.channel.send(':warning: Para crear una encuesta, debes ingresar al menos 2 opciones');
			return;
		}
		
		const eregexp = /^<a*:\w+:[0-9]+>\B/;
		const options = [];
		const resolveEmote = (uemt) => message.guild.emojis.resolve(uemt.slice(uemt.lastIndexOf(':') + 1, -1));
		args.reduce((a, b, i) => {
			const last = (i === (args.length - 1));
			let ae = a.match(eregexp);
			let be = b.match(eregexp);
			if(ae && ae.length) ae = ae[0];
			if(be && be.length) be = be[0];
			if(ae) {
				if(!be && !last)
					return `${a} ${b}`;
				else {
					const emt = resolveEmote(ae);
					const option = {
						emote: emt,
						text: a.slice(`${emt}`.length).trim()
					};
					if(last) {
						if(!be) {
							option.text = `${option.text} ${b}`;
							options.push(option);
						} else {
							options.push(option);
							options.push({ emote: resolveEmote(be), text: '' });
						}
					} else options.push(option);
					return b;
				}
			} else return b;
		});
		if(options.length < 2) {
			message.channel.send({ content: ':warning: Necesitas ingresar al menos dos opciones' });
			return;
		}

		const embed = new Discord.MessageEmbed()
			.setColor('#1da1f2')
			.setAuthor('Reacciona para votar', message.guild.iconURL({ dynamic: false, size: 256 }))
			.setTitle(`${message.guild.name} » Encuesta`)
			.setFooter(`Tiempo para votar: ${time.h}h, ${time.m}m, ${time.s}s`)
			.addField(question ? question : 'Opciones', options.map(o => `${o.emote} ${o.text}`).join('\n'));
		
		const sent = await channel.send({ embeds: [embed] });
		Promise.all([ options.map(o => sent.react(o.emote)) ]);
		const filter = (rc, u) => !u.bot && options.some(option => rc.emoji.id === option.emote.id);
		const collector = sent.createReactionCollector({ filter: filter, time: time.t * 1000 });
		collector.on('end', rcs => {
			if(!rcs.size) {
				channel.send(':older_man: No se han recibido votos. Me voy a dormir')
				return;
			}
			const counts = {};
			rcs.forEach(rc => {
				counts[rc.emoji.id] = rc.count;
			});
			console.log(counts);
			sent.reactions.removeAll();
			const embed = new Discord.MessageEmbed()
				.setColor('#1da1f2')
				.setAuthor('Resultados de la votación', message.guild.iconURL({ dynamic: false, size: 256 }))
				.setTitle(`${message.guild.name} » Encuesta finalizada`)
				.addField(question ? question : 'Votos finales', options
					.sort((a,b) => (counts[b.emote.id] || 0) - (counts[a.emote.id] || 0))
					.map(o => `${o.emote} **x ${(counts[o.emote.id] || 1) - 1}** ${o.text}`)
					.join('\n'));
			message.channel.send({ embeds: [embed] });
			if(channel.id !== message.channel.id)
				channel.send({ embeds: [embed] });
		});
	}
};