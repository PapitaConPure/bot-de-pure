import { EmbedBuilder } from 'discord.js';
import { randRange } from '../../func';
import { p_pure } from '../../utils/prefixes';
import { CommandOptions, CommandTags, Command, CommandOptionSolver, CommandParam } from '../Commons/';

const diceRegex = /([0-9]+)\s*[Dd]\s*([0-9]+)/;

const options = new CommandOptions()
	.addOptions(
		new CommandParam('dados', { name: 'conjunto', expression: '`<cantidad>`"d"`<caras>`' })
			.setDesc('para especificar la cantidad y caras de un conjunto de dados')
			.setPoly('MULTIPLE', 16)
			.setAutocomplete(async (interaction, query) => {
				let queryMatch = query.match(diceRegex);

				if(queryMatch) {
					const [ , dices, faces ] = queryMatch;
					return interaction.respond([{
						name: `${dices}d${faces}`,
						value: `${dices}d${faces}`,
					}]);
				}

				queryMatch = query.match(/(.*)[Dd](.*)/);
				if(!queryMatch) return interaction.respond([{
					name: '1d6',
					value: '1d6',
				}]);

				const [ , dices, faces ] = queryMatch;

				const dd = (isNaN(+dices) || !+dices)
					? ({ name: '❌', value: 1 })
					: ({ name: dices.trim(), value: +dices });
					
				const ff = (isNaN(+faces) || !+faces)
					? ({ name: '❌', value: 6 })
					: ({ name: faces.trim(), value: +faces });

				return interaction.respond([{
					name:  `${dd.name}d${ff.name}`,
					value: `${dd.value}d${ff.value}`,
				}]);
			}),
	);

const flags = new CommandTags().add('COMMON');

const command = new Command('dados', flags)
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
	.setExecution(async (request, args, rawArgs) => {
		let diceInputs = (
			args.isInteractionSolver()
				? CommandOptionSolver.asStrings(args.parsePolyParamSync('dados', { messageSep: ' ' })).map(v => v.match(diceRegex))
				: [ ...rawArgs.matchAll(new RegExp(diceRegex, 'g')) ]
		).filter(v => v);

		if(!diceInputs.length)
			return request.reply({
				content: [
					'⚠️ Debes ingresar al menos un conjunto de dados a tirar, como `1d6`.',
					`Para más información sobre el comando, usa \`${p_pure(request.guildId).raw}ayuda dado\``,
				].join('\n')
			});

		let dices = diceInputs
			.slice(0, 16)
			.map(parseDice);

		if(dices.some(dice => dice == null))
			return request.reply({ content: '⚠️ Entrada inválida' })

		const embed = new EmbedBuilder()
			.setColor(0x3f4581)
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
		.catch(() => { request.reply({ content: '⚠️ Entrada inválida' }); });
	});

function parseDice(diceInput: RegExpMatchArray): { d: number; f: number; r: Array<number>; t: number; } {
	if(!diceInput) return;
	
	const [ , dices, faces ] = diceInput;
	const diceNumber = +dices;
	const faceNumber = +faces;

	if(diceNumber < 1 || diceNumber > 999) return;
	if(faceNumber < 2 || faceNumber > 999) return;

	const r = Array(+dices).fill(null).map(() => randRange(1, +faces + 1));
	const t = r.reduce((a, b) => a + b);
	
	return ({
		d: diceNumber,
		f: faceNumber,
		r,
		t,
	});
}

export default command;
