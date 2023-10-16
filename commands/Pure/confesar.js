//const {  } = require('discord.js'); //Integrar discord.js
//const {  } = require('../../func.js'); //Funciones globales
//const { p_pure } = require('../../localdata/customization/prefixes.js');
//const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandManager, CommandMetaFlagsManager, CommandOptionsManager } = require('../Commons/commands.js');

const options = new CommandOptionsManager()
	.addParam('mensaje', 'TEXT', 'para indicar un mensaje de confesión')
	.addFlag('nmv', [ 'nombre', 'mostrar', 'ver' ], 'para indicar si quieres mostrar tu nombre');

const flags = new CommandMetaFlagsManager().add(
	'COMMON',
	'HOURAI',
);

const command = new CommandManager('confesar', flags)
	.setAliases(
		'confesión',
		'confesion',
		'confession',
		'confess',
	)
	.setBriefDescription('Envía una confesión anónima')
	.setLongDescription(
		'Envía una confesión anónima a ser aprobada para postearse en el canal de confesiones.',
		'Si lo deseas, el mensaje puede mostrar tu `--nombre` luego de ser aprobado.',
	)
	.setExecution(async (request, args, isSlash) => {
		console.log({ request, args, isSlash });

		return request.reply({
			content: '¡Comienza a escribir código en esta función!',
		});
	});

module.exports = command;