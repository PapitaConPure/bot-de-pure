const { MessageEmbed } = require('discord.js');
const { randRange } = require('../../func');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
	.addParam('dados', { name: 'conjunto', expression: '`<cantidad>`+"d"+`<caras>`' }, 'para especificar la cantidad y caras de un conjunto de dados', { poly: 'MULTIPLE' });

module.exports = {
	name: 'dado',
	aliases: [
		'dados', 'tirar', 'random',
		'roll', 'rolldie', 'dice', 'die',
	],
    desc: 'Tira uno o más dados de la cantidad de caras deseadas para recibir números aleatorios\n' +
		'**Ejemplo de dados:** `1d6` = 1 dado de 6 caras; `5d4` = 5 dados de 4 caras; `15d20` = 15 dados de 20 caras',
    flags: [
        'common'
    ],
    options,
	callx: '<dados>(...)',
	
	async execute(message, args) {
		if(!args.length) {
			message.channel.send({
				content:
					':warning: Debes ingresar al menos un conjunto de dados a tirar, como `1d6`.\n' +
					`Para más información sobre el comando, usa \`${p_pure(message.guildId).raw}ayuda dado\``
			});
			return;
		}

		let dices = [];
		args.map((arg, i) => {
			if(isNaN(arg)) {
				const dice = arg.split(/[Dd]/).filter(a => a);
				if(dice.length === 2)
					dices.push({ d: dice[0], f: dice[1] });
			} else if(args[i + 1]) {
				if(args[i + 1].startsWith(/[Dd]/))
					dices.push({ d: arg, f: args[i + 1] });
			}
		});
		
		if(dices.length > 16) {
			message.channel.send({ content: 'PERO NO SEAS TAN ENFERMO <:zunWTF:757163179569840138>' });
			return;
		}

		for(let d = 0; d < dices; d++){
			dice[d] = randRange(1, faces + 1);
			total += dice[d];
		};

		dices.forEach(dice => {
			dice.d = parseInt(dice.d);
			dice.f = parseInt(dice.f);
			dice.r = Array(dice.d).fill().map(() => (1 + Math.floor(Math.random() * dice.f)));
			dice.t = dice.r.reduce((a,b) => a + b);
		});

		const total = dices.map(dice => dice.t).reduce((a,b) => a + b);
		const embed = new MessageEmbed()
		.setColor('#0909a0')
		.setAuthor({ name: `${message.author.username} tiró los dados...`, iconURL: message.author.avatarURL({ format: 'png', dynamic: true, size: 512 }) })
		.addField('Salió:', dices.map(dice => `${dice.d} x :game_die:(${dice.f}) -> [${dice.r.join(',')}] = **${dice.t}**`).join('\n**+** ') + ((dices.length > 1)?`\n**= ${total}**`:''))
		
		message.channel.send({ embeds: [embed] })
		.catch(() => message.channel.send({ content: ':x: No te pasei de gracioso, ¿tamo? <:junkWTF:796930821260836864> <:pistolaR:697351201301463060>' }));
    },
};