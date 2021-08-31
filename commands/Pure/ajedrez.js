//const Discord = require('discord.js'); //Integrar discord.js
//const func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'ajedrez',
	desc: 'Inicia una partida de ajedrez común cronometrada (6 minutos + 15s/turno) en un tablero de 8x8 contra el `<adversario>` mencionado\n' +
		'Con enroque, con coronación de peón, con primer movimiento doble de peón, sin peón al paso\n' +
		'¡Puedes asignar emotes diferentes a cada pieza con las `--banderas` a disposición!\n' +
		'Si no sabes las reglas básicas de ajedrez, pues... [mira mira~](https://www.chess.com/es/como-jugar-ajedrez)',
	flags: [
		'common'
	],
	options: [
		'`<adversario>` _(mención/texto/id)_ para especificar el jugador contrario',
		'`-r <e>` o `--rey <e>` _(emote)_ para reemplazar el emote del Rey',
		'`-d <e>` o `--reina <e>` _(emote)_ para reemplazar el emote de la Reina',
		'`-t <e>` o `--torre <e>` _(emote)_ para reemplazar el emote de la torre',
		'`-c <e>` o `--caballero <e>` _(emote)_ para reemplazar el emote del caballero',
		'`-a <e>` o `--alfil <e>` _(emote)_ para reemplazar el emote del alfil',
		'`-p <e>` o `--peon <e>` _(emote)_ para reemplazar el emote del peón'
	],
	callx: '<adversario>',

	async execute(message, args) {
		//Variables de flags

		//Acción de comando
		message.channel.send({ content: 'Soon, later, never. Who knows?' });
	}
};