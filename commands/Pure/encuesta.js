const Discord = require('discord.js'); //Integrar discord.js
const { fetchFlag, fetchSentence } = require('../../func.js');
const { CommandManager } = require('../Commons/cmdBuilder.js');
const { CommandMetaFlagsManager } = require('../Commons/cmdFlags.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');

const options = new CommandOptionsManager()
	.addParam('opciones', ['EMOTE','TEXT'], 'para agregar una opción', { poly: 'MULTIPLE', })
	.addFlag('pq', ['pregunta', 'question'], 'para asignar una pregunta', 	   { name: 'txt', type: 'TEXT' })
	.addFlag('h',  ['hora', 'horas'], 	     'para añadir tiempo en horas',    { name: 'n', type: 'NUMBER' })
	.addFlag('m',  ['minuto', 'minutos'],    'para añadir tiempo en minutos',  { name: 'n', type: 'NUMBER' })
	.addFlag('s',  ['segundo', 'segundos'],  'para añadir tiempo en segundos', { name: 'n', type: 'NUMBER' });

const flags = new CommandMetaFlagsManager().add('MOD');
const command = new CommandManager('encuesta', flags)
	.setAliases(
		'votación', 'votacion', 'voto',
		'poll',
	)
	.setLongDescription(
		'Crea una encuesta con opciones',
		'Crea una encuesta con `<opciones>` que comienzan y se separan con emotes. Los emotes serán lo que se usará para votar',
		'Si así lo deseas, puedes adherir una `--pregunta` y delegar el `--canal` al cual enviar la encuesta',
		'Debido a la naturaleza de las votaciones, no podrás editar ningún aspecto de la encuesta una vez ya esté enviada. Si cometes un error, bórrala y usa el comando nuevamente',
		'Por defecto, el periodo de votación es un minuto. Puedes cambiarlo en `--horas`, `--minutos` y `--segundos`',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		if(!args.length)
			return request.reply({ content: ':warning: Necesitas ingresar al menos dos opciones' });

		//Parámetros de comando
		let channel = fetchFlag(args, {
			property: true,
			short: [ 'c' ],
			long: [ 'canal', 'channel' ],
			callback: (x,i)=> {
				let cs = x[i];
				if(cs.startsWith('<#') && cs.endsWith('>'))
					cs = cs.slice(2, -1);
				return request.guild.channels.cache.find(c => c.name.toLowerCase().indexOf(cs) !== -1 || c.id === cs);
			},
		});
		if(channel === undefined) channel = request.channel;
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
		if(time.t > 4 * 3600)
			return request.reply(':warning: El periodo de votación no puede ser mayor a 4 horas');
		
		//Acción de comando
		if(!args.length)
			return request.reply(':warning: Para crear una encuesta, debes ingresar al menos 2 opciones');
		
		const eregexp = /^<a*:\w+:[0-9]+>\B/;
		const options = [];
		const resolveEmote = (uemt) => request.guild.emojis.resolve(uemt.slice(uemt.lastIndexOf(':') + 1, -1));
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
		if(options.length < 2)
			return request.reply({ content: ':warning: Necesitas ingresar al menos dos opciones' });

		const embed = new Discord.MessageEmbed()
			.setColor('#1da1f2')
			.setAuthor({ name: 'Encuesta » Reacciona para votar', iconURL: request.guild.iconURL({ dynamic: false, size: 256 }) })
			.setFooter({ text: `Tiempo para votar: ${time.h}h, ${time.m}m, ${time.s}s` })
			.addFields({
				name: question || 'Opciones',
				value: options.map(o => `${o.emote} ${o.text}`).join('\n'),
			});
		
		const sent = await channel.send({ embeds: [embed] });
		Promise.all([ options.map(o => sent.react(o.emote)) ]);
		const filter = (rc, u) => !u.bot && options.some(option => rc.emoji.id === option.emote.id);
		const collector = sent.createReactionCollector({ filter: filter, time: time.t * 1000 });
		collector.on('collect', () => { return; });
		collector.on('end', rcs => {
			if(!rcs.size) {
				channel.send(':older_man: No se han recibido votos. Me voy a dormir');
				return;
			}
			const counts = {};
			rcs.forEach(rc => {
				counts[rc.emoji.id] = rc.count;
			});
			sent.reactions.removeAll();
			const embed = new Discord.MessageEmbed()
				.setColor('#1da1f2')
				.setAuthor({ name: 'Encuesta finalizada', iconURL: request.guild.iconURL({ dynamic: false, size: 256 }) })
				.addFields({
					name: question || 'Resultados de la votación',
					value: options
						.sort((a,b) => (counts[b.emote.id] || 0) - (counts[a.emote.id] || 0))
						.map(o => `${o.emote} **x ${(counts[o.emote.id] || 1) - 1}** ${o.text}`)
						.join('\n'),
				});
			request.channel.send({ embeds: [embed] });
			if(channel.id !== request.channel.id)
				channel.send({ embeds: [embed] });
		});
	});

module.exports = command;