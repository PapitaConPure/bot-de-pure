const global = require('../../localdata/config.json');
const { fetchFlag } = require("../../func");
const { createCanvas, loadImage, NodeCanvasRenderingContext2D } = require('canvas');
const { CommandOptionsManager } = require("../Commons/cmdOpts");
const { Message, MessageAttachment } = require('discord.js');

/**
 * @typedef {'WHITE'|'BLACK'} ChessTeam
 * @typedef {'KING'|'QUEEN'|'TOWER'|'KNIGHT'|'BISHOP'|'PAWN'|'EMPTY'} ChessPiece
 * @typedef {{piece: ChessPiece, team?: ChessTeam}} ChessCell
 */
/**@type {Array<ChessTeam>}*/
const cells = [ 'WHITE', 'BLACK' ];
/**
 * @param {Array<Array<ChessCell>>} board
 * @returns
 */
const generateBoardImage = async (board, teamColors = { white: '#fff', black: '#000' }) => {
	const canvas = createCanvas(864, 960);
	const ctx = canvas.getContext('2d');

	//#region Encabezado
	ctx.textBaseline = 'top';
	ctx.fillStyle = '#0f0f0f';
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 8;
	ctx.font = `bold 116px "headline"`;
	const texto = 'Ajedrez de Puré';
	const xcenter = (canvas.width / 2) - (ctx.measureText(texto).width / 2);
	ctx.strokeText(texto, xcenter, 4);
	ctx.fillText(texto, xcenter, 4);
	//#endregion

	//Dibujar emotes en imagen
	const size = 96;
	const tx = canvas.width / 2 - size * board.length / 2;
	const ty = ctx.measureText('M').emHeightDescent + 12;
	const chessemt = global.loademotes.chess;
	/**
	 * @param {NodeCanvasRenderingContext2D} ctx 
	 * @param {Number} x
	 * @param {Number} y
	 * @param {ChessTeam} team
	 * @param {CanvasImageSource} image
	 * @returns {HTMLCanvasElement}
	 */
	const drawPiece = (context, image, x, y, team) => {
		const thisCanvas = createCanvas(size, size);
		const ctx = thisCanvas.getContext('2d');
		ctx.save();
		ctx.fillStyle = (team === 'WHITE' ? teamColors.white : teamColors.black);
		ctx.globalAlpha = 0.5;
		ctx.fillRect(0, 0, size, size);
		ctx.globalCompositeOperation = "destination-atop";
		ctx.globalAlpha = 1;
		ctx.drawImage(image, 0, 0, size, size);
		ctx.restore();
		context.drawImage(thisCanvas, tx + x * size, ty + y * size, size, size);

		return context.canvas;
	}
	board.map((arr, y) => {
		arr.map((cell, x) => {
			ctx.drawImage(chessemt[cells[(x + y * 9) % 2]], tx + x * size, ty + y * size, size, size);
			if(cell.piece === 'EMPTY') return;
			switch(cell.piece) {
			case 'KING':	drawPiece(ctx, chessemt['king'], x, y, cell.team);
			case 'QUEEN':	drawPiece(ctx, chessemt['queen'], x, y, cell.team);
			case 'TOWER':	drawPiece(ctx, chessemt['tower'], x, y, cell.team);
			case 'KNIGHT':	drawPiece(ctx, chessemt['knight'], x, y, cell.team);
			case 'BISHOP':	drawPiece(ctx, chessemt['bishop'], x, y, cell.team);
			case 'PAWN':	drawPiece(ctx, chessemt['pawn'], x, y, cell.team);
			}
		});
	});
	
	return new MessageAttachment(canvas.toBuffer(), `ajedrez_${(Date.now() + 0)}.png`);
}

const __emote = { name: 'e', type: 'EMOTE' };
const options = new CommandOptionsManager()
	.addParam('adversario', 'USER', 	   'para especificar el jugador contrario')
	.addFlag('cs', ['configurar', 'config', 'setup'], 'para configurar el juego antes de comenzar', __emote);

module.exports = {
	name: 'ajedrez',
	brief: 'Inicia una partida de ajedrez entre tú y el adversario especificado',
	desc: 'Inicia una partida de ajedrez común cronometrada (6 minutos + 15s/turno) en un tablero de 8x8 contra el `<adversario>` mencionado\n' +
		'Con enroque, con coronación de peón, con primer movimiento doble de peón, sin peón al paso\n' +
		'¡Puedes asignar emotes diferentes a cada pieza con las `--banderas` a disposición!\n' +
		'Si no sabes las reglas básicas de ajedrez, pues... [mira mira~](https://www.chess.com/es/como-jugar-ajedrez)',
	flags: [
		'common',
		'maintenance'
	],
	options,
	callx: '<adversario>',

	/**
	 * @param {Message} message
	 * @param {Array<String>} args
	 */
	async execute(message, args) {
		//Parámetros básicos
		const emtcache = global.slots.slot3.emojis.cache;
		const resEmote = async (x, i) => (await emtcache.resolve(x[i])).id;
		const query = { property: true, callback: resEmote };
		const pieces = {
			king: 	fetchFlag(args, { ...query, short: ['r'], long: ['rey'], 				 callback: resEmote, fallback: 'king' }),
			queen: 	fetchFlag(args, { ...query, short: ['d'], long: ['reina','dama'], 		 callback: resEmote, fallback: 'queen' }),
			tower: 	fetchFlag(args, { ...query, short: ['t'], long: ['torre'], 				 callback: resEmote, fallback: 'tower' }),
			knight: fetchFlag(args, { ...query, short: ['c'], long: ['caballero','caballo'], callback: resEmote, fallback: 'knight' }),
			bishop: fetchFlag(args, { ...query, short: ['a'], long: ['alfil'], 				 callback: resEmote, fallback: 'bishop' }),
			pawn: 	fetchFlag(args, { ...query, short: ['p'], long: ['peón','peon'], 		 callback: resEmote, fallback: 'pawn' }),
		};

		//Acción de comando
		/**@type {Array<Array<ChessCell>>}*/
		const board = Array(8).fill(null).map((_, y) => Array(8).fill(null).map(() => {
			if([1,6].includes(y))
				return { piece: 'PAWN', team: y < 4 ? 'BLACK' : 'WHITE' };
			return { piece: 'EMPTY' };
		}));


		const imagen = await generateBoardImage(board, { white: '#fce803', black: '#4011b8' });
		await message.channel.send({ files: [imagen] });
	},

	async interact(interaction, args) {
		//Variables de flags

		//Acción de comando
		await interaction.reply({ content: 'Soon, later, never. Who knows?', ephemeral: true });
	}
};