const global = require('../../localdata/config.json');
const { guildEmoji } = require("../../func");
const { createCanvas, loadImage, NodeCanvasRenderingContext2D } = require('canvas');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');
const { AttachmentBuilder } = require('discord.js');

/**
 * @typedef {'WHITE'|'BLACK'} ChessTeam
 * @typedef {'KING'|'QUEEN'|'TOWER'|'KNIGHT'|'BISHOP'|'PAWN'|'EMPTY'} ChessPiece
 * @typedef {{piece: ChessPiece, team?: ChessTeam}} ChessCell
 */
/**@type {Array<ChessTeam>}*/
const cells = [ 'WHITE', 'BLACK' ];
/**
 * @param {Array<Array<ChessCell>>} board
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
	
	return new AttachmentBuilder(canvas.toBuffer(), { name: `ajedrez_${(Date.now() + 0)}.png` });
}

const options = new CommandOptions()
	.addParam('adversario', 'USER', 	   			   'para especificar el jugador contrario')
	.addFlag('sgp', ['conjunto', 'set', 'piezas'],     'para usar un set de piezas personalizado')
	.addFlag('cs',  ['configurar', 'config', 'setup'], 'para configurar un conjunto de piezas antes de comenzar');
const flags = new CommandTags().add(
	'COMMON',
	'GAME',
	'MAINTENANCE',
);
const command = new CommandManager('ajedrez', flags)
	.setBriefDescription('Inicia una partida de ajedrez entre tú y el adversario especificado')
	.setLongDescription(
		'Inicia una partida de ajedrez común cronometrada (6 minutos + 15s/turno) en un tablero de 8x8 contra el `<adversario>` mencionado',
		'Con enroque, con coronación de peón, con primer movimiento doble de peón, sin peón al paso',
		'¡Puedes asignar emotes diferentes a cada pieza con las `--banderas` a disposición!',
		'Si no sabes las reglas básicas de ajedrez, pues... [mira mira~](https://www.chess.com/es/como-jugar-ajedrez)',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		//Parámetros básicos
		const { guild, guildId } = request;
		const piecesSet = options.fetchFlag(args, 'conjunto', { callback: (x, i = null) => i ? x[i] : x });
		const pieces = {};
		for(const piece in piecesSet)
			pieces[piece] = guildEmoji(piecesSet[guildId][piece], guild) ?? piece;

		//Acción de comando
		/**@type {Array<Array<ChessCell>>}*/
		const board = Array(8).fill(null).map((_, y) => Array(8).fill(null).map(() => {
			if([1,6].includes(y))
				return { piece: 'PAWN', team: y < 4 ? 'BLACK' : 'WHITE' };
			return { piece: 'EMPTY' };
		}));

		const imagen = await generateBoardImage(board, { white: '#fce803', black: '#4011b8' });
		return request.reply({ files: [imagen] });
	});

module.exports = command;