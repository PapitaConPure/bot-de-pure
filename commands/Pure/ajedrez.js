//const global = require('../../localdata/config.json');
//const { fetchFlag } = require("../../func");
const { CommandOptionsManager } = require("../Commons/cmdOpts");

const __emote = { name: 'e', type: 'EMOTE' };
const options = new CommandOptionsManager()
	.addParam('adversario', 'USER', 		'para especificar el jugador contrario')
	.addFlag('r', 'rey', 					'para reemplazar el emote del Rey', 	  __emote)
	.addFlag('d', ['reina', 'dama'], 		'para reemplazar el emote de la Reina',   __emote)
	.addFlag('t', 'torre', 					'para reemplazar el emote de la torre',   __emote)
	.addFlag('c', ['caballero', 'caballo'], 'para reemplazar el emote del caballero', __emote)
	.addFlag('a', 'alfil', 					'para reemplazar el emote del alfil', 	  __emote)
	.addFlag('p', ['peon', 'peón'], 		'para reemplazar el emote del peón', 	  __emote);

module.exports = {
	name: 'ajedrez',
	brief: 'Inicia una partida de ajedrez entre tú y el adversario especificado',
	desc: 'Inicia una partida de ajedrez común cronometrada (6 minutos + 15s/turno) en un tablero de 8x8 contra el `<adversario>` mencionado\n' +
		'Con enroque, con coronación de peón, con primer movimiento doble de peón, sin peón al paso\n' +
		'¡Puedes asignar emotes diferentes a cada pieza con las `--banderas` a disposición!\n' +
		'Si no sabes las reglas básicas de ajedrez, pues... [mira mira~](https://www.chess.com/es/como-jugar-ajedrez)',
	flags: [
		'common'
	],
	options,
	callx: '<adversario>',

	async execute(message, args) {
		//Parámetros básicos
		/*const cemt = message.client.emojis;
		const resEmote = async (x, i) => await cemt.resolve(x[i]);
		const query = { property: true, callback: resEmote };
		const whites = {
			cell:	await global.slots.slot3.emojis.cache.find(e => e.name === 'wCell'),
			king: 	fetchFlag(args, { ...query, short: ['r'], long: ['rey'], 				 fallback: cemt.cache.get('') }),
			queen: 	fetchFlag(args, { ...query, short: ['d'], long: ['reina','dama'], 		 fallback: cemt.cache.get('') }),
			tower: 	fetchFlag(args, { ...query, short: ['t'], long: ['torre'], 				 fallback: cemt.cache.get('') }),
			knight: fetchFlag(args, { ...query, short: ['c'], long: ['caballero','caballo'], fallback: cemt.cache.get('') }),
			bishop: fetchFlag(args, { ...query, short: ['a'], long: ['alfil'], 				 fallback: cemt.cache.get('') }),
			pawn: 	fetchFlag(args, { ...query, short: ['p'], long: ['peón','peon'], 		 fallback: cemt.cache.get('') }),
		};
		console.log(Object.values(whites).filter(e => e).map(e => e.name));

		//Acción de comando
		const board = Array(8).fill(null).map(a => Array(8).fill());*/
		await message.channel.send({ content: 'Soon, later, never. Who knows?' });
	},

	async interact(interaction, args) {
		//Variables de flags

		//Acción de comando
		await interaction.reply({ content: 'Soon, later, never. Who knows?', ephemeral: true });
	}
};