const { improveNumber } = require("../../func");
const { CommandTags, Command, CommandOptions, CommandOptionSolver } = require('../Commons/');
const { calc } = require('../../systems/others/mathreader.js');

const flags = new CommandTags().add('COMMON');
const options = new CommandOptions()
	.addParam('operación', 'TEXT', ' para expresar la operación matemátca')
	.addFlag(['a','s'], 'acortar', 'para acortar el resultado')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' });
const command = new Command('calcular', flags)
	.setAliases('calc', 'clc', 'cx')
	.setBriefDescription('Realiza un cálculo básico y devuelve el resultado')
	.setLongDescription(
		'Realiza un cálculo básico y devuelve el resultado.',
		'Usa + para sumar, - para restar, * para multiplicar, / para dividir, ^ para exponenciar, % para sacar módulo y () para asociar términos',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const shorten = args.hasFlag('acortar');
		const minDigits = args.flagExprIf('mínimo', v => CommandOptionSolver.asNumber(v), 1);
		const operation = args.getString('operación', true);

		if(!operation)
			return request.reply({ content: '⚠️ Debes ingresar una operación' });
		
		try {
			const result = calc(operation);

			if(isNaN(result))
				return request.reply({ content: '⚠️ La operación no pertenece al dominio de los números Reales' });
			
			return request.reply({ content: improveNumber(result, { shorten, minDigits }) });
		} catch(error) {
			console.log(error);
			return request.reply({ content: '⚠️ Operación inválida' });
		}
	});

module.exports = command;
