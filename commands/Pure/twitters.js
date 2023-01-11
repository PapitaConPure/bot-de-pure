const Discord = require('discord.js'); //Integrar discord.js
const { fetchFlag, fetchSentence } = require('../../func.js');
const { auditError } = require('../../systems/auditor.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add(
	'MOD',
	'HOURAI',
);
const options = new CommandOptionsManager()
	.addParam('twitters', { name: 'enlace', expression: 'https://twitter.com/' }, 'para colocar uno o más Twitters en un nuevo tablón', { poly: 'MULTIPLE', polymax: 12 })
	.addFlag('c',  'canal', 				 'para especificar en qué canal enviar/editar un tablón', { name: 'ch',  type: 'CHANNEL' })
	.addFlag([],   'id', 			   		 'para especificar un tablón ya enviado a editar',		  { name: 'msg', type: 'MESSAGE' })
	.addFlag('a',  ['agregar', 'añadir'],    'para añadir enlaces a un tablón ya enviado')
	.addFlag('er', ['eliminar', 'remover'],  'para remover enlaces de un tablón ya enviado')
	.addFlag([],   ['epígrafe', 'epigrafe'], 'para asignar el texto por encima del título', 		  { name: 'epi', type: 'TEXT' })
	.addFlag([],   ['título', 'titulo'], 	 'para asignar un título', 								  { name: 'ttl', type: 'TEXT' })
	.addFlag([],   'pie', 			   	     'para asignar el texto por debajo de los enlaces',		  { name: 'pie', type: 'TEXT' });
const command = new CommandManager('twitters', flags)
	.setAliases('twitter')
	.setDescription(
		'Para mostrar Twitters de artistas con los que trabaja Hourai Doll',
		'Crea un nuevo tablón con los `<twitters>` designados (separados solamente por un espacio)',
		'Alternativamente, puedes especificar una `--id` de un tablón ya enviado para editarlo, especificando qué `<twitters>` `--agregar` o `--eliminar`',
		'El tablón se añadirá o se buscará por `--id` para editar *en el canal actual* a menos que especifiques un `--canal`',
		'Puedes crear un tablón con `--epígrafe`, `--título` y `--pie` de título personalizados',
	)
	.setOptions(options)
	.setExecution(async (message, args) => {
		if(!args.length)
			return message.reply({ content: ':warning: Necesitas ingresar al menos un enlace de Twitter o propiedad de tablón' });

		//Parámetros de comando
		let edit = fetchFlag(args, { short: [ 'a' ], long: ['agregar', 'añadir'], callback: 'add' });
		if(edit == undefined)
			edit = fetchFlag(args, { short: [ 'e' ], long: ['eliminar'], callback: 'del', fallback: '' });
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
			epigraph: fetchFlag(args, { property: true, long: ['epígrafe', 'epigrafe'], callback: fetchSentence }),
			title: fetchFlag(args, { property: true, long: ['título', 'titulo'], callback: fetchSentence }),
			footer: fetchFlag(args, { property: true, long: ['pie'], callback: fetchSentence })
		};
		if(!edit.length && id != undefined)
			for(e in embedprops)
				if(e !== undefined) {
					edit = 'mod';
					break;
				}
		
		//Acción de comando
		if(ch == undefined) ch = message.channel;
		const linkbase = 'https://twitter.com/';
		const div = 10;
		if(!edit.length) {
			//Creación de nuevo embed
			if(!args.length)
				return message.reply(':warning: Para crear un nuevo tablón de Twitters, debes ingresar algunos links iniciales');
			
			const twitters = args.map(arg => (arg.startsWith(linkbase))?`[@${arg.slice(linkbase.length)}](${arg})`:undefined);

			if(twitters.some(twitter => twitter === undefined))
				return message.reply({ content: ':warning: Uno o más enlaces tenían un formato inválido' });

			const embed = new Discord.MessageEmbed()
				.setColor('#1da1f2')
				.setTitle(embedprops.title ?? 'Tablón de Twitters')
				.setAuthor({ name: embedprops.epigraph ?? '¡Clickea el enlace que gustes!', iconURL: message.channel.guild.iconURL({ dynamic: false, size: 256 }) })
				.setFooter({ text: embedprops.footer ?? null });
			
			for(page = 0; page < twitters.length; page += div)
				embed.addFields({
					name: `Tabla ${Math.ceil(page / div) + 1}`,
					value: twitters.slice(page, page + div).join('\n'),
					inline: true,
				});
			
			return ch.send({ embeds: [embed] });
		}
		
		if(id == undefined)
			return message.reply({ content: 'Para añadir o eliminar mensajes en un embed ya enviado, debes facilitar la ID del mensaje.' });

		//Modificación de embed existente
		const msg = await ch.messages.fetch(id).catch(auditError);

		if(!msg)
			return message.reply({ content: `:warning: ID de mensaje inválida` });

		if(msg.embeds == undefined || msg.author.id !== message.client.user.id)
			return message.reply({ content: ':warning: El mensaje especificado existe pero no me pertenece o no tiene ningún embed' });

		const target = msg.embeds[0];
		const ntw = args.map(arg => (arg.startsWith(linkbase))?`[@${arg.slice(linkbase.length)}](${arg})`:undefined);
		if(ntw.some(nt => nt === undefined))
			return message.reply({ content: ':warning: Uno o más enlaces tenían un formato inválido' });

		let twitters = target.fields[0].value.split('\n');
		for(page = 1; page < target.fields.length; page++)
			twitters = [...twitters, ...target.fields[page].value.split('\n')];

		const embed = new Discord.MessageEmbed()
			.setColor(target.color)
			.setTitle(embedprops.title ?? target.title)
			.setAuthor({ name: embedprops.epigraph ?? target.author.name, iconURL: message.channel.guild.iconURL({ dynamic: false, size: 256 }) })
			.setFooter({ text: embedprops.footer !== undefined ? embedprops.footer : (target.footer ? target.footer.text : '') });
		
		if(edit === 'add')
			twitters = [...twitters, ...ntw];
		else if(edit === 'del')
			twitters = twitters.filter(twitter => !ntw.some(nt => twitter === nt));
			
		for(page = 0; page < twitters.length; page += div)
			embed.addFields({
				name: `Tabla ${Math.ceil(page / div) + 1}`,
				value: twitters.slice(page, page + div).join('\n'),
				inline: true,
			});

		msg.edit({ embeds: [embed] });
		return message.react('✅');
	});

module.exports = command;