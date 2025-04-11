const { improveNumber } = require('../../func.js'); //Funciones globales
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('COMMON');
const options = new CommandOptions()
	.addParam('num', 'NUMBER', 'para designar el número a operar')
	.addFlag(['a','s'], 'acortar', 'para acortar el número')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' })
	.addFlag(['n','e'], 'exponente', 'para exponenciar el número', { name: 'exp', type: 'NUMBER' });
const command = new CommandManager('número', flags)
	.setAliases('numero', 'núm', 'num')
	.setDescription('Para operar un número. Sí, solo eso, tenía ganas de jugar con algo')
	.setOptions(options)
	.setExecution(async (request, args) => {
		//Acción de comando
		const shorten = args.parseFlag('acortar');
		const min = args.parseFlagExpr('mínimo',    (/**@type {Number}*/x) => x, 1);
		const exp = args.parseFlagExpr('exponente', (/**@type {Number}*/x) => x, 1);
		
		let num = args.getNumber('num');
		if(!num) return request.reply({ content: '⚠️ Debes ingresar un número' });
		num = Math.pow(num, exp);
		return request.reply({ content: improveNumber(num, shorten, min) });
	});

module.exports = command;
