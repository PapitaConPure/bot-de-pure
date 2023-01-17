const { improveNumber } = require("../../func");
const { CommandMetaFlagsManager, CommandManager, CommandOptionsManager } = require("../Commons/commands");
const { calc } = require('../../systems/mathreader.js');

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
	.addParam('operación', 'TEXT', ' para expresar la operación matemátca')
	.addFlag(['a','s'], 'acortar', 'para acortar el resultado')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' });
const command = new CommandManager('calcular', flags)
	.setAliases('calc', 'clc', 'cx')
	.setBriefDescription('Realiza un cálculo básico y devuelve el resultado')
	.setLongDescription(
		'Realiza un cálculo básico y devuelve el resultado.',
		'Usa + para sumar, - para restar, * para multiplicar, / para dividir, ^ para exponenciar, % para sacar módulo y () para asociar términos',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const shorten = options.fetchFlag(args, 'acortar');
		const min = options.fetchFlag(args, 'mínimo', { fallback: 1 });
		const operation = options.fetchParam(args, 'operación', true)?.replace(/ /g, '');

		if(!operation)
			return request.reply({ content: '⚠ Debes ingresar una operación' });
		
		try {
			const result = calc(operation);
			return request.reply({ content: improveNumber(result, shorten, min) });
		} catch(error) {
			return request.reply({ content: '⚠ Operación inválida' });
		}
	});

module.exports = command;