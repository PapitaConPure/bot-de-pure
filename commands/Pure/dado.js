const { MessageEmbed } = require('discord.js');
const { randRange } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
	.addParam('dados', { name: 'conjunto', expression: '`<cantidad>`"d"`<caras>`' }, 'para especificar la cantidad y caras de un conjunto de dados', { poly: 'MULTIPLE' });
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('dados', flags)
	.setAliases(
		'dado', 'tirar', 'random',
		'roll', 'rolldie', 'dice', 'die',
	)
	.setBriefDescription('Tira 1 ó más dados de la cantidad de caras deseadas y muestra el resultado')
	.setLongDescription(
		'Tira uno o más dados de la cantidad de caras deseadas para recibir números aleatorios',
		'**Ejemplo de dados:** `1d6` = 1 dado de 6 caras; `5d4` = 5 dados de 4 caras; `15d20` = 15 dados de 20 caras',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		let diceInputs = isSlash
			? options.fetchParamPoly(args, 'dados', args.getString, [])
			: args;
			
		if(!diceInputs.length)
			return request.reply({
				content: [
					':warning: Debes ingresar al menos un conjunto de dados a tirar, como `1d6`.',
					`Para más información sobre el comando, usa \`${p_pure(request.guildId).raw}ayuda dado\``,
				].join('\n')
			});

		let dices = diceInputs.map((arg, i) => {
			if(isNaN(arg)) {
				const dice = arg.split(/[Dd]/).filter(a => a);
				if(dice.length === 2)
					return ({
						d: dice[0],
						f: dice[1]
					});
			} else if(diceInputs[i + 1]?.startsWith(/[Dd]/))
				return ({
					d: arg,
					f: diceInputs[i + 1]
				});
		}).filter(dice => dice);

		if(!dices.length)
			return request.reply({ content: '⚠ Entrada inválida' })
		
		if(dices.length > 16 || dices.some(dice => dice.d > 999))
			return request.reply({ content: 'PERO NO SEAS TAN ENFERMO <:zunWTF:757163179569840138>' });

		dices.forEach(dice => {
			dice.d = parseInt(dice.d);
			dice.f = parseInt(dice.f);
			dice.r = Array(dice.d).fill().map(_ => randRange(1, dice.f + 1));
			dice.t = dice.r.reduce((a,b) => a + b);
		});

		const user = request.author ?? request.user;
		const embed = new MessageEmbed()
			.setColor('#3f4581')
			.setAuthor({ name: `${user.username} tiró los dados...`, iconURL: user.avatarURL({ format: 'png', dynamic: true, size: 512 }) })
			.addFields({
				name: 'Salió:',
				value: dices.map(dice => `${dice.d} x 🎲(${dice.f}) → [${dice.r.join(',')}] = **${dice.t}**`).join('\n**+** '),
			});

		if(dices.length > 1)
			embed.addFields({
				name: 'Total',
				value: `${dices.map(dice => dice.t).reduce((a,b) => a + b)}`,
			});
		
		return request.reply({ embeds: [embed] })
		.catch(() => request.reply({ content: ':x: No te pasei de gracioso, ¿tamo? <:junkWTF:796930821260836864> <:pistolaR:697351201301463060>' }));
	});

module.exports = command;