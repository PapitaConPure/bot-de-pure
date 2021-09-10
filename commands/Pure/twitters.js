const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const { fetchFlag, fetchSentence } = require('../../func.js');

module.exports = {
	name: 'twitters',
	aliases: [
		'twitter'
	],
	desc: 'Para mostrar Twitters de artistas con los que trabaja Hourai Doll\n' +
	'Crea un nuevo tablón con los `<twitters>` designados (separados solamente por un espacio)\n' +
	'Alternativamente, puedes especificar una `--id` de un tablón ya enviado para editarlo, especificando qué `<twitters>` `--agregar` o `--eliminar`\n' +
	'El tablón se añadirá o se buscará por `--id` para editar *en el canal actual* a menos que especifiques un `--canal`\n' +
	'Puedes crear un tablón con `--epígrafe`, `--título` y `--pie` de título personalizados',
	flags: [
		'mod',
		'hourai'
	],
	options: [
		'`<twitters(...)>` _(enlace: https://twitter.com/ [múltiple])_ para colocar uno o más Twitters en un nuevo tablón',
		'`--canal <ch>` o `-c <ch>` _(canal)_ para especificar en qué canal enviar/editar un tablón',
		'`--id <msgid>` _(ID de mensaje)_ para especificar un tablón ya enviado a editar',
		'`-a <twitter>` o `--agregar <twitter>` para añadir Twitters a un tablón ya enviado',
		'`-e <twitter>` o `--eliminar <twitter>` para remover Twitters de un tablón ya enviado',
		'`--epígrafe <epi>` _(texto)_ para asignar el texto por encima del título',
		'`--título <titulo>` _(texto)_ para asignar un título',
		'`--pie <pie>` _(texto)_ para asignar el texto por debajo de los Twitters'
	],
	callx: '<twitters(...)>',

	async execute(message, args) {
		if(!args.length) {
			message.channel.send({ content: ':warning: Necesitas ingresar al menos un enlace de Twitter o propiedad de tablón' });
			return;
		}

		//Parámetros de comando
		let edit = fetchFlag(args, { short: [ 'a' ], long: [ 'agregar' ], callback: 'add' });
		if(edit === undefined)
			edit = fetchFlag(args, { short: [ 'e' ], long: [ 'eliminar' ], callback: 'del', fallback: '' });
		let ch = fetchFlag(args, {
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
		let id = fetchFlag(args, { property: true, short: [], long: [ 'id' ], callback: (x,i) => x[i] });
		const embedprops = {
			epigraph: fetchFlag(args, { property: true, long: [ 'epígrafe', 'epigrafe' ], callback: fetchSentence }),
			title: fetchFlag(args, { property: true, long: [ 'título', 'titulo' ], callback: fetchSentence }),
			footer: fetchFlag(args, { property: true, long: [ 'pie' ], callback: fetchSentence })
		};
		if(!edit.length && id != undefined)
			for(e in embedprops)
				if(e !== undefined) {
					edit = 'mod';
					break;
				}
		
		//Acción de comando
		if(ch === undefined) ch = message.channel;
		const linkbase = 'https://twitter.com/';
		const div = 10;
		if(!edit.length) {
			//Creación de nuevo embed
			if(!args.length) {
				message.channel.send(':warning: Para crear un nuevo tablón de Twitters, debes ingresar algunos links iniciales');
				return;
			}
			
			const twitters = args.map(arg => (arg.startsWith(linkbase))?`[@${arg.slice(linkbase.length)}](${arg})`:undefined);

			if(twitters.some(twitter => twitter === undefined)) {
				message.channel.send({ content: ':warning: Uno o más enlaces tenían un formato inválido' });
				return;
			}

			const embed = new Discord.MessageEmbed()
				.setColor('#1da1f2')
				.setAuthor(embedprops.epigraph !== undefined ? embedprops.epigraph : '¡Clickea el enlace que gustes!', message.channel.guild.iconURL({ dynamic: false, size: 256 }))
				.setTitle(embedprops.title !== undefined ? embedprops.title : 'Tablón de Twitters')
				.setFooter(embedprops.footer !== undefined ? embedprops.footer : '');
			
			for(page = 0; page < twitters.length; page += div)
				embed.addField(`Tabla ${Math.ceil(page / div) + 1}`, twitters.slice(page, page + div).join('\n'), true);
			
			ch.send({ embeds: [embed] });
		} else if(id !== undefined) {
			//Modificación de embed existente
			ch.messages.fetch(id).then(msg => {
				if(msg.embeds === undefined || msg.author.id !== message.client.user.id) {
					message.channel.send({ content: ':warning: El mensaje especificado existe pero no me pertenece o no tiene ningún embed' });
					return;
				}

				const target = msg.embeds[0];
				const ntw = args.map(arg => (arg.startsWith(linkbase))?`[@${arg.slice(linkbase.length)}](${arg})`:undefined);
				if(ntw.some(nt => nt === undefined)) {
					message.channel.send({ content: ':warning: Uno o más enlaces tenían un formato inválido' });
					return;
				}

				let twitters = target.fields[0].value.split('\n');
				for(page = 1; page < target.fields.length; page++)
					twitters = [...twitters, ...target.fields[page].value.split('\n')];

				const embed = new Discord.MessageEmbed()
					.setColor(target.color)
					.setAuthor(embedprops.epigraph !== undefined ? embedprops.epigraph : target.author.name, message.channel.guild.iconURL({ dynamic: false, size: 256 }))
					.setTitle(embedprops.title !== undefined ? embedprops.title : target.title)
					.setFooter(embedprops.footer !== undefined ? embedprops.footer : (target.footer ? target.footer.text : ''));
				
				if(edit === 'add')
					twitters = [...twitters, ...ntw];
				else if(edit === 'del')
					twitters = twitters.filter(twitter => !ntw.some(nt => twitter === nt));
					
				for(page = 0; page < twitters.length; page += div)
					embed.addField(`Tabla ${Math.ceil(page / div) + 1}`, twitters.slice(page, page + div).join('\n'), true);

				msg.edit({ embeds: [embed] });
				message.react('✅');
			}).catch(err => {
				console.error(err);
				message.channel.send({ content: `:warning: ID de mensaje inválida` });
			});
		} else
			message.channel.send({ content: 'Para añadir o eliminar mensajes en un embed ya enviado, debes facilitar la ID del mensaje.' });
	}
};