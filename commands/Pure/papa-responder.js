const Discord = require('discord.js'); //Integrar discord.js
const func = require('../../func.js'); //Funciones globales
const uses = require('../../sguses.json'); //Lista de usos desde el último reinicio del Bot

module.exports = {
	name: 'papa-responder',
	aliases: [
		'papa-r'
	],
	desc: 'Manda una respuesta específica de `p!sugerir` al `--usuario` designado\n' +
		'La respuesta si no se incluyen las banderas `--aceptar` y `--problema` es una confirmación de lectura',
	flags: [
		'papa'
	],
	options: [
		'`-u` o `--usuario` _(mención/texto/id)_ para especificar el usuario al cual responder',
		'`-a` o `--aceptar` para confirmar aceptación de sugerencia',
		'`-p` o `--problema` _(texto)_ para reportar un problema con la expresión de la sugerencia'
	],

	execute(message, args) {
		//Comprobación de liquidación de abuso
		if(uses[message.author.id] === undefined)
			uses[message.author.id] = 1;
		else if(uses[message.author.id] <= 3)
			uses[message.author.id]++;
		else {
			message.channel.send(':octagonal_sign: Límite de usos por reinicio del proceso alcanzado. Inténtalo nuevamente cuando me haya reiniciado (generalmente cada 24 horas)');
			return;
		}
		
		message.channel.send(`\`${uses[message.author.id]}\``);

		//Variables de flags
		let user;
		let mode;

		//Lectura de flags
		let jn = false;
		args = args.map((arg, i) => {
			let ignore = true;
			if(!jn) {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'usuario': user = func.resolverIDUsuario(args[i + 1], message.channel.guild, message.client); jn = true; break;
					case 'aceptar': mode = 'a'; break;
					case 'problema': mode = 'p'; break;
					default: ignore = false;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'u': user = func.resolverIDUsuario(args[i + 1], message.channel.guild, message.client); jn = true; break;
						case 'a': mode = 'a'; break;
						case 'p': mode = 'p'; break;
						default: ignore = false;
						}
				else ignore = false;
			} else jn = false;

			if(ignore) return undefined;
			else return arg;
		}).filter(arg => arg !== undefined);

		//Acción de comando
		if(user === undefined) {
			message.channel.send(':warning: ¡Usuario no encontrado!');
			return;
		}
		user = message.client.users.cache.get(user);

		if(mode === undefined) //Confirmación de lectura
			user.send('📩 ¡Se confirmó que tu sugerencia ha sido leída! Si es aceptada, se te notificará de igual forma; en caso contrario, no recibirás ninguna notificación.');
		else if(mode === 'a') //Confirmación de aceptación
			user.send(
				'💌 ¡Se confirmó que tu sugerencia ha sido aceptada! ¡¡¡Muchas gracias por tu colaboración!!! <:meguSmile:796930824627945483>\n' +
				'_Ten en cuenta que es probable que se hagan modificaciones al plan en base a diversos factores._'
			);
		else { //Reporte de problema
			const embed = new Discord.MessageEmbed()
				.setColor('#aa5555')
				.setAuthor('Bot de Puré#9243', message.client.user.avatarURL({ size: 256 }))
				.setTitle('Problema de presentación de sugerencia')
				.addField('Detalle', args.join(' '));
			user.send(':mailbox_with_mail: Llegó una notificación emergente del Buzón de Sugerencias.\n*__Nota:__ Bot de Puré no opera con mensajes privados.*', embed);
		}
	}
};