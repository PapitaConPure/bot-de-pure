const Discord = require('discord.js'); //Integrar discord.js
const { auditError } = require('../../systems/others/auditor.js');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');
const { CommandPermissions } = require('../Commons/cmdPerms.js');

const perms = CommandPermissions.adminOnly();
const flags = new CommandTags().add(
	'MOD',
	'HOURAI',
);
const options = new CommandOptions()
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
	.setBriefDescription('Crea un tablón de Twitters en un canal o sobre un mensaje')
	.setLongDescription(
		'Muestra Twitters de artistas con los que trabaja Saki Scans',
		'Crea un nuevo tablón con los `<twitters>` designados (separados solamente por un espacio)',
		'Alternativamente, puedes especificar una `--id` de un tablón ya enviado para editarlo, especificando qué `<twitters>` `--agregar` o `--eliminar`',
		'El tablón se añadirá o se buscará por `--id` para editar *en el canal actual* a menos que especifiques un `--canal`',
		'Puedes crear un tablón con `--epígrafe`, `--título` y `--pie` de título personalizados',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false) => {
		if(!isSlash && !args.length)
			return request.reply({ content: '⚠️ Necesitas ingresar al menos un enlace de Twitter o propiedad de tablón' });

		//Parámetros de comando
		let edit = options.fetchFlag(args, 'agregar', { callback: 'add' });
		if(edit == undefined)
			edit = options.fetchFlag(args, 'eliminar', { callback: 'del', fallback: '' });
		let ch = options.fetchFlag(args, 'canal', {
			callback: (cs, isSlash) => {
				if(isSlash) return cs;

				if(cs.startsWith('<#') && cs.endsWith('>'))
					cs = cs.slice(2, -1);
				return request.guild.channels.cache.find(c => c.name.toLowerCase().indexOf(cs) !== -1 || c.id === cs);
			},
		});
		let id = options.fetchFlag(args, 'id');
		const embedprops = {
			epigraph: options.fetchFlag(args, 'epígrafe'),
			title: 	  options.fetchFlag(args, 'título'),
			footer:   options.fetchFlag(args, 'pie'),
		};
		
		if(!edit.length && id != undefined)
			for(e in embedprops)
				if(e !== undefined) {
					edit = 'mod';
					break;
				}

		const getTwitters = () => {
			const twitters = isSlash
				? options.fetchParamPoly(args, 'twitters', args.getString, [])
				: args;

			return twitters.map(twitter => (
				twitter?.startsWith(linkbase))
					? `[@${twitter.slice(linkbase.length)}](${twitter})`
					: undefined
			);
		}
		
		//Acción de comando
		if(ch == undefined) ch = request.channel;
		const linkbase = 'https://twitter.com/';
		const div = 10;
		if(!edit.length) {
			const twitters = getTwitters();

			if(!twitters.length)
				return request.reply('⚠️ Para crear un nuevo tablón de Twitters, debes ingresar algunos links iniciales');

			if(twitters.some(twitter => twitter === undefined))
				return request.reply({ content: '⚠️ Uno o más enlaces tenían un formato inválido' });

			const embed = new Discord.EmbedBuilder()
				.setColor(0x1da1f2)
				.setTitle(embedprops.title ?? 'Tablón de Twitters')
				.setAuthor({ name: embedprops.epigraph ?? '¡Clickea el enlace que gustes!', iconURL: request.channel.guild.iconURL({ size: 256 }) })
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
			return request.reply({ content: 'Para añadir o eliminar mensajes en un embed ya enviado, debes facilitar la ID del mensaje.' });

		//Modificación de embed existente
		const msg = await ch.messages.fetch(id).catch(auditError);

		if(!msg)
			return request.reply({ content: `⚠️ ID de mensaje inválida` });

		if(msg.embeds == undefined || msg.author.id !== request.client.user.id)
			return request.reply({ content: '⚠️ El mensaje especificado existe pero no me pertenece o no tiene ningún embed' });

		/**@type {Discord.EmbedBuilder}*/
		const target = msg.embeds[0];
		const ntw = getTwitters();

		if(ntw.some(nt => nt === undefined))
			return request.reply({ content: '⚠️ Uno o más enlaces tenían un formato inválido' });

		let twitters = target.fields[0].value.split('\n');
		for(page = 1; page < target.fields.length; page++)
			twitters = [...twitters, ...target.fields[page].value.split('\n')];

		const embed = new Discord.EmbedBuilder()
			.setColor(target.color)
			.setTitle(embedprops.title ?? target.title ?? null)
			.setAuthor({ name: embedprops.epigraph ?? target.author.name ?? request.guild.name, iconURL: request.guild.iconURL({ size: 256 }) })
			.setFooter({ text: embedprops.footer ?? target.footer?.text ?? null });
		
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
		return isSlash ? request.reply({ content: '✅ Hecho', ephemeral: true }) : request.react('✅');
	});

module.exports = command;