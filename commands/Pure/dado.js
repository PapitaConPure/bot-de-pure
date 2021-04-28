const { p_pure } = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'dado',
	aliases: [
		'dados', 'tirar', 'random',
		'roll', 'rolldie', 'die',
	],
    desc: 'Tira uno o más dados de la cantidad de caras deseadas para recibir números aleatorios\n' + 
		'**Ejemplo de dados:** `1d6` = 1 dado de 6 caras; `5d4` = 5 dados de 4 caras; `15d20` = 15 dados de 20 caras',
    flags: [
        'common'
    ],
    options: [
		'`<cantidad>` _(número)_ para especificar una cantidad de dados',
		'`<caras>` _(número)_ para especificar las caras de un dado',
		'[`<cantidad><caras>(...)]>` _(grupo: `<cantidad>d<caras>` [múltiple])_ para tirar una cantidad de dados de X caras'
    ],
	callx: '[<cantidad><caras>(...)]',
	
	execute(message, args) {
		if(!args.length) {
			message.channel.send(`:warning: Debes ingresar al menos un conjunto de dados a tirar, como \`1d6\`.\nPara más información sobre el comando, usa \`${p_pure}ayuda dado\``);
			return;
		}

		let dices = [];
		args.map((arg, i) => {
			if(isNaN(arg)) {
				const dice = arg.split('d').filter(a => a);
				if(dice.length === 2)
					dices.push({ d: dice[0], f: dice[1] });
			} else if(args[i + 1].startsWith('d'))
				dices.push({ d: arg, f: args[i + 1] });
		});
		
		if(dices.length > 16) {
			message.channel.send('PERO NO SEAS TAN ENFERMO <:zunWTF:757163179569840138>');
			return;
		}

		for(let d = 0; d < dices; d++){
			dice[d] = randInt(1, faces + 1);
			total += dice[d];
		};

		dices.forEach(dice => {
			dice.d = parseInt(dice.d);
			dice.f = parseInt(dice.f);
			dice.r = Array(dice.d).fill().map(() => (1 + Math.floor(Math.random() * dice.f)));
			dice.t = dice.r.reduce((a,b) => a + b);
		});
		const total = dices.map(dice => dice.t).reduce((a,b) => a + b);

		message.channel.send(dices.map(dice => `${dice.d} x :game_die:(${dice.f}) -> [${dice.r.join(',')}] = **${dice.t}**`).join('\n**+** ') + ((dices.length > 1)?`\n**= ${total}**`:''))
		.catch(() => message.channel.send(':x: No te pasei de gracioso, ¿tamo? <:comodowo:824759668437811224> <:pistolaR:697351201301463060>'));
    },
};