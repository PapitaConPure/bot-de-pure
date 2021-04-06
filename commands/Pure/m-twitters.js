const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-twitters',
	aliases: [
		'm-twitter'
	],
	desc: 'Para mostrar Twitters de artistas con los que trabaja Hourai Doll\n' +
	'Crea un nuevo embed con los `<twitters>` designados (separados solamente por un espacio)\n' +
	'Alternativamente, puedes especificar una `--id` de un embed ya enviado para editarlo, especificando qué `<twitters>` `--agregar` o `--eliminar`\n' +
	'El embed se añadirá o se buscará por `--id` para editar *en el canal actual* a menos que especifiques un `--canal`',
	flags: [
		'mod',
		'hourai'
	],
	options: [,
		'`<twitters(...)>` _(enlace: https://twitter.com/ [múltiple])_ para colocar uno o más Twitters en un nuevo embed',
		'`--canal <ch>` o `-c <ch>` _(canal)_ para especificar en qué canal enviar/editar un embed',
		'`--id <msgid>` _(ID de mensaje)_ para especificar un embed ya enviado a editar',
		'`-a <twitter>` o `--agregar <twitter>` para añadir Twitters a un embed ya enviado',
		'`-e <twitter>` o `--eliminar <twitter>` para remover Twitters de un embed ya enviado'
	],
	callx: '<twitters(...)>',

	execute(message, args) {
		if(args.length === 0) {
			message.channel.send(':warning: Necesitas ingresar al menos un enlace de Twitter');
			return;
		}

		//Variables de flags
		let edit = '';
		let ch;
		let id;

		/*Lectura de flags
			* las flags ingresadas se ignoran como argumentos
			* las flags que requieren un valor hacen también ignorar el mismo como argumento (especificar con jn = true)
			*/
		let jn = false;
		args = args.map((arg, i) => {
			let ignore = true;
			if(!jn) {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'canal':
						let narg = args[i + 1];
						jn = true;
						if(narg.startsWith('<#') && narg.endsWith('>'))
							narg = narg.slice(2, -1);
						ch = message.guild.channels.cache.filter(ch => 
							ch.name.toLowerCase().indexOf(narg) !== -1 || ch.id === narg
						).first();
					break;
					case 'id': jn = true; id = args[i + 1]; break;
					case 'agregar': edit = 'add'; break;
					case 'eliminar': edit = 'del'; break;
					default: ignore = false; break;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'c':
							jn = true;
							if(arg.startsWith('<#') && arg.endsWith('>'))
								arg = arg.slice(2, -1);
							ch = message.guild.channels.cache.filter(ch => 
								ch.name.toLowerCase().indexOf(args[i + 1]) !== -1 || ch.id === args[i + 1]
							).first();
						break;
						case 'a': edit = 'add'; break;
						case 'e': edit = 'del'; break;
						default: ignore = false; break;
						}
				else ignore = false;
			} else jn = false;

			if(ignore) return undefined;
			else return arg;
		}).filter(arg => arg !== undefined);
		
		//Acción de comando
		if(ch === undefined) ch = message.channel;
		const linkbase = 'https://twitter.com/';
		const div = 10;
		if(!edit.length) {
			const twitters = args.map(arg => (arg.startsWith(linkbase))?`[@${arg.slice(linkbase.length)}](${arg})`:undefined);

			if(!twitters.some(twitter => twitter === undefined)) {
				const embed = new Discord.MessageEmbed()
					.setColor('#1da1f2')
					.setAuthor(`Hourai Doll`, message.channel.guild.iconURL({ dynamic: false, size: 256 }))
					.setTitle('¡Gracias a los artistas por darnos permiso~♥!')
					.setFooter('許可をいただいたアーティストの方々に感謝いたします。(´• ω •`) ♡');
				{
					let page = 0;
					while(page < twitters.length) {
						embed.addField(`Tabla ${Math.ceil(page / div) + 1}`, twitters.slice(page, page + div).join('\n'), true);
						page += div;
					}
				}
				
				ch.send(embed);
			} else
				message.channel.send(':warning: Uno o más enlaces tenían un formato inválido');
		} else if(id !== undefined) {
			ch.messages.fetch(id).then(msg => {
				if(msg.embeds === undefined || msg.author.id !== message.client.user.id) {
					message.channel.send(':warning: El mensaje especificado existe pero no me pertenece o no tiene ningún embed');
					return;
				}
				const ntw = args.map(arg => (arg.startsWith(linkbase))?`[@${arg.slice(linkbase.length)}](${arg})`:undefined);

				if(!ntw.some(nt => nt === undefined)) {
					let twitters = msg.embeds[0].fields[0].value.split('\n');
					{
						let page = 1;
						while(page < msg.embeds[0].fields.length) {
							twitters = twitters.concat(msg.embeds[0].fields[page].value.split('\n'));
							page++;
						}
					}

					const embed = new Discord.MessageEmbed()
						.setColor('#1da1f2')
						.setAuthor(`Hourai Doll`, message.channel.guild.iconURL({ dynamic: false, size: 256 }))
						.setTitle('¡Gracias a los artistas por darnos permiso~♥!')
						.setFooter('許可をいただいたアーティストの方々に感謝いたします。(´• ω •`) ♡');
					
					if(edit === 'add')
						twitters = twitters.concat(ntw);
						else if(edit === 'del')
						twitters = twitters.filter(twitter => !ntw.some(nt => twitter === nt));
						
					{
						let page = 0;
						while(page < twitters.length) {
							embed.addField(`Tabla ${Math.ceil(page / div) + 1}`, twitters.slice(page, page + div).join('\n'), true);
							page += div;
						}
					}

					msg.edit(embed);
					message.react('✅');
				} else
					message.channel.send(':warning: Uno o más enlaces tenían un formato inválido');
			}).catch(err => {
				console.error(err);
				message.channel.send(`:warning: ID de mensaje inválida`);
			});
		} else
			message.channel.send('Para añadir o eliminar mensajes en un embed ya enviado, debes facilitar la ID del mensaje.');
	}
};