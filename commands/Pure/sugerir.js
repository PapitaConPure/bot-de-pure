const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../localdata/config.json'); //Variables globales
const uses = require('../../localdata/sguses.json'); //Lista de usos desde el último reinicio del Bot
const { CommandOptionsManager } = require('../Commons/cmdOpts');

function getTitle(a, i) {
	if(i >= a.length) //Título inválido
		return 'Sugerencia sin título';
	else if(a[i].startsWith('"')) { //Título largo
		let l = i;
		let tt;

		while(l < a.length && !a[l].endsWith('"')) l++;
		tt = a.slice(i, l + 1).join(' ').slice(1);

		if(tt.length > 1) return (tt.endsWith('"'))?tt.slice(0, -1):tt;
		else return 'Sugerencia sin título';
	} else //Título corto
		return a[i];
};

const options = new CommandOptionsManager()
	.addFlag('t', ['título', 'titulo'], 'para designar un título o "título largo"', { name: 'ttl', type: 'TEXT' });

module.exports = {
	name: 'sugerir',
	aliases: [
		's'
	],
	desc: 'Para sugerir mejoras sobre el Bot. Todas las sugerencias van a una buzón que tarde o temprano será leído\n' +
		'No es obligatorio, pero pueden agregar un `-t título` o un `-t "título largo"` a su sugerencia (me facilita cosas)\n' +
		'De antemano, ¡gracias por ayudar con el desarrollo de Bot de Puré! <a:meguDance:796931539739869235>',
	flags: [
		'common'
	],
	options,
	callx: '<sugerencia>',

	async execute(message, args) {
		//Comprobación de liquidación de abuso
		if(uses[message.author.id] === undefined)
			uses[message.author.id] = 1;
		else if(uses[message.author.id] < 3)
			uses[message.author.id]++;
		else {
			message.channel.send({ content: ':octagonal_sign: Límite de usos por reinicio del proceso alcanzado. Inténtalo nuevamente cuando me haya reiniciado (generalmente cada 24 horas)' });
			return;
		}

		//Variables de flags
		let title = 'Sugerencia sin título';

		//Lectura de flags
		let jn = false;
		args = args.map((arg, i) => {
			let ignore = true;
			if(!jn) {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'titulo': title = getTitle(args, i + 1); jn = true; break;
					default: ignore = false;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 't': title = getTitle(args, i + 1); jn = true; break;
						default: ignore = false;
						}
				else ignore = false;
			} else if(arg.endsWith('"') || title.split(' ').length === 1) jn = false;

			if(ignore) return undefined;
			else return arg;
		}).filter(arg => arg !== undefined);

		//Acción de comando
		if(!args.length) {
			message.channel.send({ content: ':warning: Campo de sugerencia vacío.' });
			return;
		}

		const embed = new Discord.MessageEmbed()
			.setColor('#608bf3')
			.setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 256 }))
			.setTitle(title)
			.addField('Mensaje', args.join(' '))
			.addField('Respuestas',
				`\`p!papa-responder -u ${message.author.id}\` para confirmar lectura\n` +
				`\`p!papa-responder -u ${message.author.id} -a\` para confirmar de aceptación\n` +
				`\`p!papa-responder -u ${message.author.id} -p <problema>\` para reportar problema`
			);
		message.client.guilds.cache.get(global.serverid.sugerencias).channels.cache.get('826632022075768835').send({ embeds: [embed] });
		message.channel.send({ content: `📨 ¡Se ha enviado tu sugerencia como **${title}**! Recibirás una notificación por privado si es leída, si es aceptada y si ocurre algún problema. ¡Gracias!` });
	}
};