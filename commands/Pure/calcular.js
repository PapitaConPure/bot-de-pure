const { improveNumber } = require("../../func");
const { auditError } = require("../../systems/auditor");
const { CommandMetaFlagsManager, CommandManager, CommandOptionsManager } = require("../Commons/commands");

const emot = [
	'Mi polola', 'Mi reina', 'Mi princesa', 'Mi esposa', 'Mi mujer',
	':wine_glass:', ':wine_glass::wine_glass:', ':wine_glass::wine_glass::wine_glass:',
	'No avancé en el manga de Komachi', 'Mañana lo hago', 'Otro día', 'Mañana sin falta', 'Esta semana lo termino', 'Procrastinar'
];

const flags = new CommandMetaFlagsManager().add('COMMON');
const options = new CommandOptionsManager()
	.addParam('operación', 'TEXT', ' para expresar la operación matemátca')
	.addFlag(['a','s'], 'acortar', 'para acortar el resultado')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' });
const command = new CommandManager('calcular', flags)
	.setAliases('calc', 'clc', 'cx')
	.setLongDescription(
		'Realiza un cálculo básico y devuelve el resultado.',
		'Usa + para sumar, - para restar, * para multiplicar, / para dividir, ^ para exponenciar, % para sacar módulo y () para asociar términos',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const shorten = options.fetchFlag(args, 'acortar', { callback: true, fallback: false });
		const min = options.fetchFlag(args, 'mínimo', { fallback: 1 });
		const operation = options.fetchParam(args, 'operación', true)?.replace(/ /g, '');

		if(!operation)
			return request.reply({ content: '⚠ Debes ingresar una operación' });
		
		// .split(/[+-*\/^]/)
		try {
			const solveExpression = expression => {
				console.log('MONDONGO MONDONGO MONDONGO MONDONGO MONDONGO MONDONGO MONDONGO MONDONGO MONDONGO');
				console.log(expression);
				if(Array.isArray(expression))
					expression = expression.flat().join('');
				if(expression.endsWith('*') || expression.endsWith('/'))
					return expression;
				console.log(expression);
				if(isNaN(expression.charAt(0)))
					expression = expression.slice(1);

				let items = expression.split(/(?<=[+\-*\/^]+)|(?=[+\-*\/^]+)/g);
				console.log({ operators: items, length: items.length });

				if(items.length === 1)
					return items[0];

				let precedence = 2;
				while(precedence >= 0) {
					console.log('=======================================');
					console.log(items);
					items.forEach((p, i) => {
						console.log(p, i, !isNaN(items[i]), !i, i === items.length - 1)
						if(!isNaN(items[i]) || !i || i === items.length - 1)
							return;

						let succeeded = true;
						while(succeeded) {
							const op1 = items[i - 1] * 1;
							const op2 = items[i + 1] * 1;
							const operator = items[i];
							console.log(op1, operator, op2, precedence);
						
							succeeded = false;
							switch(precedence) {
								case 0:
									if(operator == '+') {
										console.log(`Realizando ${op1} + ${op2} =`, op1 + op2, '|', items);
										items.splice(i, 2);
										items[i - 1] = op1 + op2;
										console.log(items);
										succeeded = true;
									}
									if(operator == '-') {
										console.log(`Realizando ${op1} - ${op2} =`, op1 - op2, '|', items);
										items.splice(i, 2);
										items[i - 1] = op1 - op2;
										console.log(items);
										succeeded = true
									}
									break;
								case 1:
									if(operator == '*') {
										console.log('Realizando * =', op1 * op2);
										items.splice(i, 2);
										items[i - 1] = op1 * op2;
										succeeded = true
									}
									if(operator == '/') {
										console.log('Realizando /');
										items.splice(i, 2);
										items[i - 1] = op1 / op2;
										succeeded = true
									}
									break;
								case 2:
									if(operator == '^') {
										console.log('Realizando ^');
										items.splice(i, 2);
										items[i - 1] = Math.pow(op1, op2);
										succeeded = true
									}
									break;
							}
						}
					});
					console.log({ localResult: items[0] });
					precedence--;
				}

				const lastItem = items[items.length - 1];
				if(isNaN(lastItem))
					return items;
				return items[0];
			};
			const seperateExpression = expression => {
				console.log({ expression: expression });

				if(!expression.includes('(')) {
					if(expression.includes(')'))
						throw new Error('Invalid Operation');
					return solveExpression(expression);
				}

				if(!expression.includes(')'))
					throw new Error('Invalid Operation');

			const groups = expression.split(/[\(\)]+/g).slice(0, -1);

				console.log({ groups: groups });

				return solveExpression(groups.map(group => seperateExpression(group)));
			};

			const result = seperateExpression(operation);
			console.log(operation, result);
			return request.reply({ content: improveNumber(result, shorten, min) });
		} catch(error) {
			if(error.message !== 'Invalid Operation')
				console.error(error);
			return request.reply({ content: '⚠ Operación inválida' });
		}

	});

module.exports = command;