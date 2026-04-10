import { improveNumber } from '@/func';
import { Translator } from '@/i18n';
import { Command, CommandOptionSolver, CommandOptions, CommandTags } from '../commons';

const tags = new CommandTags().add('COMMON');

const options = new CommandOptions()
	.addParam('num', 'NUMBER', 'para designar el número a operar')
	.addFlag(['a', 's'], 'acortar', 'para acortar el número')
	.addFlag(['m', 'd'], ['mínimo', 'minimo', 'digitos'], 'para designar el mínimo de dígitos', {
		name: 'minimo',
		type: 'NUMBER',
	})
	.addFlag(['n', 'e'], 'exponente', 'para exponenciar el número', {
		name: 'exp',
		type: 'NUMBER',
	});

const command = new Command('número', tags)
	.setAliases('numero', 'núm', 'num')
	.setDescription('Para operar un número. Sí, solo eso, tenía ganas de jugar con algo')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request);

		const shorten = args.hasFlag('acortar');
		const minDigits = args.flagExprIf('mínimo', (x) => CommandOptionSolver.asNumber(x), 1);
		const exp = args.flagExprIf('exponente', (x) => CommandOptionSolver.asNumber(x), 1);

		let num = args.getNumber('num');
		if (!num) return request.reply({ content: translator.getText('invalidNumber') });
		num = num ** exp;
		return request.reply({ content: improveNumber(num, { shorten, minDigits }) });
	});

export default command;
