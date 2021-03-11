const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-twitters',
	desc: 'Para mostrar Twitters de artistas con los que trabaja Hourai Doll.\n' +
	'Crea un nuevo embed con los enlaces designados (separados solamente por un espacio).\n' +
	'Alternativamente, puedes especificar una `--id` de un embed ya enviado para editarlo, especificando qué Twitters `--agregar` o `--eliminar`.',
	flags: [
		'mod',
		'hourai'
	],
	options: [,
		'`<twitter>` _(url: https://twitter.com/)_ para colocar uno o más Twitters en un nuevo embed',
		'`--id <eid>` _(ID de mensaje)_ para especificar un embed ya enviado a editar',
		'`-a <twitter>` o `--agregar <twitter>` para añadir Twitters a un embed ya enviado',
		'`-e <twitter>` o `--eliminar <twitter>` para remover Twitters de un embed ya enviado'
	],
	callx: '<twitter>',

	execute(message, args) {
		if(message.member.hasPermission('MANAGE_ROLES', false, true, true)) {
			//Variables de flags
			let edit = false;

			//Lectura de flags
			args.map(arg => {
				if(arg.startsWith('--'))
					switch(arg.slice(2)) {
					case 'agregar': edit = true; break;
					}
				else if(arg.startsWith('-'))
					for(c of arg.slice(1))
						switch(c) {
						case 'a': edit = true; break;
						}
			});

			//Acción de comando

		} else message.channel.send(':warning: necesitas tener el permiso ***ADMINISTRAR ROLES** (MANAGE ROLES)* para usar este comando.');
	}
};

/*
https://twitter.com/kokeTouhou
https://twitter.com/shinra__bansho
https://twitter.com/nanasenao
https://twitter.com/OlH7w
https://twitter.com/sasagume
https://twitter.com/rokugou
https://twitter.com/QK_rabbit_2
https://twitter.com/kirero
https://twitter.com/RokudoRuten
https://twitter.com/waramori_fuzuka
https://twitter.com/rmrafrn_
https://twitter.com/ayu_yutyaso
https://twitter.com/simerike7
https://twitter.com/kachulie
https://twitter.com/MZNS_UMAI7
https://twitter.com/k0mamid0ri
https://twitter.com/goma_feet
https://twitter.com/mikadukimo777
*/