const { improveNumber } = require('../../func.js'); //Funciones globales
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
	.addParam('num', 'NUMBER', 'para designar el número a operar')
	.addFlag(['a','s'], 'acortar', 'para acortar el número')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' })
	.addFlag(['n','e'], 'exponente', 'para exponenciar el número', { name: 'exp', type: 'NUMBER' });
const command = new CommandManager('número', flags)
	.setAliases('numero', 'núm', 'num')
	.setDescription('Para operar un número. Sí, solo eso, tenía ganas de jugar con algo')
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false) => {
		//Acción de comando
		const shorten = options.fetchFlag(args, 'acortar');
		const min = options.fetchFlag(args, 'mínimo', { fallback: 1 });
		const exp = options.fetchFlag(args, 'exponente', { fallback: 1 });
		
		let num = isSlash ? args.getNumber('num') : args.shift();
		if(!num) return request.reply({ content: '⚠️ Debes ingresar un número' });
		num = Math.pow(num, exp);
		return request.reply({ content: improveNumber(num, shorten, min) });
	});

module.exports = command;