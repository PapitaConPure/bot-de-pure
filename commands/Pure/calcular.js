const { improveNumber } = require("../../func");
const { CommandTags, CommandManager, CommandOptions, CommandOptionSolver } = require("../Commons/commands");
const { calc } = require('../../systems/mathreader.js');

const flags = new CommandTags().add('COMMON');
const options = new CommandOptions()
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
		const min = CommandOptionSolver.asNumber(options.fetchFlag(args, 'mínimo', { fallback: 1 }));
		const operation = CommandOptionSolver.asString(await options.fetchParam(args, 'operación', true));

		if(!operation)
			return request.reply({ content: '⚠️ Debes ingresar una operación' });
		
		try {
			const result = calc(operation);

			if(isNaN(result))
				return request.reply({ content: '⚠️ La operación no pertenece al dominio de los números Reales' });
			
			return request.reply({ content: improveNumber(result, shorten, min) });
		} catch(error) {
			console.log(error);
			return request.reply({ content: '⚠️ Operación inválida' });
		}
	});

module.exports = command;