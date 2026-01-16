import { improveNumber } from '../../func';
import { CommandTags, Command, CommandOptions, CommandOptionSolver } from '../Commons/';
import { calc, MathEvaluatorError, MathLexerError, MathParserError } from '../../systems/others/mathreader';
import { Colors, ContainerBuilder, MessageFlags } from 'discord.js';
import { Translator } from '../../i18n';

const tags = new CommandTags().add('COMMON');

const options = new CommandOptions()
	.addParam('operación', 'TEXT', ' para expresar la operación matemátca')
	.addFlag(['a','s'], 'acortar', 'para acortar el resultado')
	.addFlag(['m','d'], ['mínimo','minimo','digitos'], 'para designar el mínimo de dígitos', { name: 'minimo', type: 'NUMBER' });

const command = new Command('calcular', tags)
	.setAliases('calc', 'clc', 'cx')
	.setBriefDescription('Realiza un cálculo básico y devuelve el resultado')
	.setLongDescription(
		'Realiza un cálculo básico y devuelve el resultado.',
		'Usa + para sumar, - para restar, * para multiplicar, / para dividir, ^ para exponenciar, % para sacar módulo y () para asociar términos',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request);

		const shorten = args.hasFlag('acortar');
		const minDigits = args.flagExprIf('mínimo', v => CommandOptionSolver.asNumber(v), 1);
		const operation = args.getString('operación', true);

		if(!operation)
			return request.reply({ content: '⚠️ Debes ingresar una operación' });

		try {
			const result = calc(operation);

			if(isNaN(result))
				return request.reply({ content: '⚠️ La operación no pertenece al dominio de los números Reales' });

			return request.reply({ content: improveNumber(result, { shorten, minDigits, translator }) });
		} catch(err) {
			if(err instanceof MathLexerError || err instanceof MathParserError || err instanceof MathEvaluatorError)
				return request.reply({
					flags: MessageFlags.IsComponentsV2,
					components: [
						new ContainerBuilder()
							.setAccentColor(Colors.Red)
							.addTextDisplayComponents(textDisplay =>
								textDisplay.setContent([
									'### -# ⚠️ Operación inválida',
									'```',
									err.message,
									'```',
								].join('\n'))
							)
					],
				});

			console.log(err);
			return request.reply({ content: '⚠️ Ocurrió un error inesperado al intentar operar' });
		}
	});

export default command;
