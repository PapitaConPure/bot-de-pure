const global = require('../../localdata/config.json'); //Variables globales
const { makeWeightedDecision, compressId } = require('../../func.js');
const { createCanvas, loadImage } = require('canvas');
const { EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder, Colors, ButtonBuilder, ButtonStyle } = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { Puretable, AUser, pureTableAssets } = require('../../localdata/models/puretable.js');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require("../Commons/commands");
const { makeStringSelectMenuRowBuilder, makeButtonRowBuilder } = require('../../tsCasts');
const { Translator } = require('../../internationalization');

/**@typedef {{ name: string, emoji: string, weight: number, shape: Array<Array<number>> }} Skill*/

/**@satisfies {Record<string, Skill>} */
const skills = /**@type {const}*/({
	hline: {
		name: 'Habilidad Horizontal',
		emoji: '↔️',
		weight: 3,
		shape: [ Array(32).fill(1) ], //Cappeado a 16 emojis
	},
	vline: {
		name: 'Habilidad Vertical',
		emoji: '↕️',
		weight: 3,
		shape: Array(32).fill(1), //Cappeado a 16 emojis
	},
	x: {
		name: 'Habilidad Cruzada',
		emoji: '❌',
		weight: 3,
		shape: [ //17 emojis
			[ 1,  ,  ,  ,  ,  ,  ,  , 1 ],
			[  , 1,  ,  ,  ,  ,  , 1,   ],
			[  ,  , 1,  ,  ,  , 1,  ,   ],
			[  ,  ,  , 1,  , 1,  ,  ,   ],
			[  ,  ,  ,  , 1,  ,  ,  ,   ],
			[  ,  ,  , 1,  , 1,  ,  ,   ],
			[  ,  , 1,  ,  ,  , 1,  ,   ],
			[  , 1,  ,  ,  ,  ,  , 1,   ],
			[ 1,  ,  ,  ,  ,  ,  ,  , 1 ],
		],
	},
	square: {
		name: 'Habilidad Cuadrada',
		emoji: '🟥',
		weight: 3,
		shape: [ //16 emojis
			[ 1, 1, 1, 1, 1 ],
			[ 1,  ,  ,  , 1 ],
			[ 1,  ,  ,  , 1 ],
			[ 1,  ,  ,  , 1 ],
			[ 1, 1, 1, 1, 1 ],
		],
	},
	circle: {
		name: 'Habilidad Circular',
		emoji: '🔵',
		weight: 3,
		shape: [ //16 emojis
			[  ,  , 1, 1, 1,  ,   ],
			[  , 1,  ,  ,  , 1,   ],
			[ 1,  ,  ,  ,  ,  , 1 ],
			[ 1,  ,  ,  ,  ,  , 1 ],
			[ 1,  ,  ,  ,  ,  , 1 ],
			[  , 1,  ,  ,  , 1,   ],
			[  ,  , 1, 1, 1,  ,   ],
		],
	},
	diamond: {
		name: 'Habilidad Diamante',
		emoji: '💎',
		weight: 4,
		shape: [ //12 emojis
			[  ,  ,  , 1,  ,  ,   ],
			[  ,  , 1,  , 1,  ,   ],
			[  , 1,  ,  ,  , 1,   ],
			[ 1,  ,  ,  ,  ,  , 1 ],
			[  , 1,  ,  ,  , 1,   ],
			[  ,  , 1,  , 1,  ,   ],
			[  ,  ,  , 1,  ,  ,   ],
		],
	},
	tetris: {
		name: 'Habilidad Tetrápeda',
		emoji: '🕹️',
		weight: 3,
		shape: [ //16 emojis
			[ 1, 1,  ,  ,  ,  ,   ],
			[ 1,  ,  ,  , 1, 1,   ],
			[ 1,  ,  , 1, 1,  ,   ],
			[  ,  ,  ,  ,  ,  , 1 ],
			[  ,  , 1,  ,  ,  , 1 ],
			[  , 1, 1, 1,  ,  , 1 ],
			[  ,  ,  ,  ,  ,  , 1 ],
		],
	},
	p: {
		name: 'Habilidad Tubércula',
		emoji: '🥔',
		weight: 3,
		shape: [ //16 emojis
			[ 1, 1, 1, 1,   ],
			[  , 1,  ,  , 1 ],
			[  , 1,  ,  , 1 ],
			[  , 1, 1, 1,   ],
			[  , 1,  ,  ,   ],
			[  , 1,  ,  ,   ],
			[ 1, 1, 1,  ,   ],
		],
	},
	exclamation: {
		name: 'Habilidad Exclamativa',
		emoji: '❗',
		weight: 2.5,
		shape: [ //22 emojis
			[  , 1, 1,   ],
			[ 1, 1, 1, 1 ],
			[ 1, 1, 1, 1 ],
			[ 1, 1, 1, 1 ],
			[  , 1, 1,   ],
			[  , 1, 1,   ],
			[  ,  ,  ,   ],
			[  , 1, 1,   ],
			[  , 1, 1,   ],
		],
	},
	a: {
		name: 'Habilidad Anárquica',
		emoji: '🅰',
		weight: 3,
		shape: [ //16 emojis
			[  ,  , 1,  ,   ],
			[  , 1,  , 1,   ],
			[  , 1,  , 1,   ],
			[ 1,  ,  ,  , 1 ],
			[ 1, 1, 1, 1, 1 ],
			[ 1,  ,  ,  , 1 ],
			[ 1,  ,  ,  , 1 ],
		],
	},
	ultimate: {
		name: 'Habilidad Definitiva',
		emoji: '👑',
		weight: 1,
		shape: [ //52 emojis
			[  ,  , 1, 1, 1, 1, 1,  ,   ],
			[  , 1, 1,  , 1,  , 1, 1,   ],
			[ 1, 1,  ,  , 1, 1,  , 1, 1 ],
			[ 1,  , 1, 1, 1, 1,  ,  , 1 ],
			[ 1, 1, 1, 1,  , 1, 1, 1, 1 ],
			[ 1,  ,  , 1, 1, 1, 1,  , 1 ],
			[ 1, 1,  , 1, 1,  ,  , 1, 1 ],
			[  , 1, 1,  , 1,  , 1, 1,   ],
			[  ,  , 1, 1, 1, 1, 1,  ,   ],
		],
	},
});
const skillOptions = Object.entries(skills).map(([ key, skill ]) => ({ weight: skill.weight, value: { key, skill } }));

const baseDropRate = 0.01;
const userLevelDropRateIncrease = 0.69;
const maxExp = 30;

const options = new CommandOptions()
	.addParam('posición', 'NUMBER', 'para especificar una celda a modificar', { poly: [ 'x', 'y' ], optional: true })
	.addParam('emote',    'EMOTE',  'para especificar un emote a agregar',    {                     optional: true })
	.addFlag('p', 'perfil', 'para ver tu perfil anárquico')
	.addFlag('sh', [ 'skill', 'habilidad', 'especial', 'special' ], 'para usar una habilidad especial');
const flags = new CommandTags().add(
	'COMMON',
	'GAME',
);
const command = new CommandManager('anarquia', flags)
	.setAliases('anarquía', 'a')
	.setBriefDescription('Para interactuar con la Tabla de Puré')
	.setLongDescription(
		'Para interactuar con la __Tabla de Puré__\n' +
		'**Tabla de Puré**: tablero de 16x16 celdas de emotes ingresados por usuarios de cualquier server\n\n' +
		'Puedes ingresar un `<emote>` en una `<posición(x,y)>` o, al no ingresar nada, ver la tabla\n' +
		'La `<posicion(x,y)>` se cuenta desde 1x,1y, y el `<emote>` designado debe ser de un server del que yo forme parte~\n\n' +
		'De forma aleatoria, puedes ir desbloqueando habilidades para rellenar líneas completas en `--horizontal` o `--vertical`. La probabilidad inicial es 1% en conjunto, y aumenta +1% por cada __nivel__\n' +
		`**Nivel**: nivel de usuario en minijuego Anarquía. +1 por cada *30 usos*\n\n` +
		'Incluso si usas una habilidad de línea, debes ingresar ambos ejes (`x,y`) en orden\n' +
		`Ingresa únicamente \`p\` para ver tu perfil anárquico`
	)
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const { image: pureTableImage } = pureTableAssets;
		const loadEmotes = global.loademotes;

		const translator = await Translator.from(request.user);

		//Revisar perfil
		const perfil = args.parseFlag('perfil');
		if(perfil) {
			const { user, member, userId } = request;
			const auser = await AUser.findOne({ userId });

			const embed = new EmbedBuilder()
				.setColor(0xbd0924)
				.setAuthor({ name: user.username, iconURL: member.displayAvatarURL({ extension: 'png', size: 512 }) });
			if(auser)
				embed.setTitle('Perfil anárquico')
					.addFields(
						{ name: 'Inventario', value: `↔️ x ${auser.skills.h}\n↕ x ${auser.skills.v}`, inline: true },
						{ name: 'Rango', value: `Nivel ${Math.floor(auser.exp / 30) + 1} (exp: ${auser.exp % maxExp})`, inline: true },
					);
			else
				embed.setTitle('Perfil inexistente')
					.addFields({
						name: 'Este perfil anárquico no existe todavía',
						value:
							`Usa \`${p_pure(request.guildId).raw}anarquia <posición(x,y)> <emote>\` para colocar un emote en la tabla de puré y crearte un perfil anárquico automáticamente\n` +
							`Si tienes más dudas, usa \`${p_pure(request.guildId).raw}ayuda anarquia\``
					});
			return request.reply({ embeds: [embed] });
		}
		
		const reactIfMessage = async (/**@type {String}*/ reaction) => request.isMessage && request.inferAsMessage().react(reaction);
		
		const skill = CommandOptionSolver.asString(args.parseFlagExpr('skill'));
		const inverted = args.isMessageSolver() && isNaN(+args.args[0]);
		let pos, emote;
		if(inverted) emote = args.getString('emote');
		pos = CommandOptionSolver.asNumbers(args.parsePolyParamSync('posición', { regroupMethod: 'NONE' })).filter(x => !isNaN(x));
		if(!inverted) emote = args.getString('emote');

		console.log(skill, pos, emote);

		if((pos.length === 2 && !emote)
		|| (pos.length  <  2 &&  emote)
		|| (pos.length  <  2 &&  skill)) {
			reactIfMessage('⚠️');
			return request.reply({ content: '⚠️️ Entrada inválida', ephemeral: true });
		}

		/**@type {Array<EmbedBuilder>} */
		const embeds = [];

		//Ingresar emotes a tabla
		if(pos.length) {
			const { userId } = request;
			const auser = (await AUser.findOne({ userId })) || new AUser({ userId });
			
			//Tiempo de enfriamiento por usuario
			if((Date.now() - auser.last) / 1000 < 3) {
				reactIfMessage('⌛');
				return request.reply({ content: '⌛ ¡No tan rápido!', ephemeral: true });
			} else
				auser.last = Date.now();
			
			const emoteMatch = emote.match(/^<a*:\w+:([0-9]+)>$/);
			if(!emoteMatch) {
				reactIfMessage('⚠️️');
				return request.reply({ content: '⚠️️ Emoji inválido', ephemeral: true });
			}
			const emoteId = emoteMatch[1];
	
			//Variables de ingreso
			if(!request.client.emojis.cache.has(emoteId)) {
				reactIfMessage('⚠️️');
				return request.reply({ content: '⚠️️ No reconozco ese emoji. Solo puedo usar emojis de servidores en los que esté', ephemeral: true });
			}

			await request.deferReply();

			//Posición de emote
			const cells = (await Puretable.findOne({})).cells;
			const originalX = Math.floor(pos[0]) - 1;
			const originalY = Math.floor(pos[1]) - 1;
			const correctedX = Math.max(0, Math.min(originalX, cells[0].length - 1));
			const correctedY = Math.max(0, Math.min(originalY, cells.length - 1));
	
			//Cargar imagen nueva si no está registrada
			if(!loadEmotes.hasOwnProperty(emoteId))
				loadEmotes[emoteId] = await loadImage(request.client.emojis.cache.get(emoteId).imageURL({ extension: 'png', size: 64 }));
	
			//Insertar emote en posición
			if(skill) {
				const authorId = compressId(userId);
				return request.editReply({
					embeds: [new EmbedBuilder()
						.setColor(Colors.Fuchsia)
						.setAuthor({ name: request.user.username, iconURL: request.member.displayAvatarURL({ size: 256 })})
						.setTitle('¡A punto de usar una habilidad!')
						.setDescription(`Centrada en la posición (${correctedX + 1}, ${correctedY + 1}) del tablero`)
						.setThumbnail(request.client.emojis.cache.get(emoteId).imageURL({ extension: 'png', size: 512 }))
					],
					components: [
						makeStringSelectMenuRowBuilder().addComponents(
							new StringSelectMenuBuilder()
								.setCustomId(`anarquia_selectSkill${authorId}_${compressId(emoteId)}`)
								.setPlaceholder('Escoge una habilidad...')
								.addOptions(
									Object.entries(skills).map(([ key, skill ]) => ({
										value: key,
										label: skill.name,
										emoji: skill.emoji,
									}))
								)
						),
						makeButtonRowBuilder().addComponents(
							new ButtonBuilder()
								.setCustomId(`anarquia_cancel_${authorId}`)
								.setLabel(translator.getText('buttonCancel'))
								.setEmoji('936531643496288288')
								.setStyle(ButtonStyle.Danger)
						),
					],
				});
			}

			cells[correctedY][correctedX] = emoteId;
			
			await Puretable.updateOne({}, { cells });
	
			//Sistema de nivel de jugador y adquisición de habilidades
			const userLevel = Math.floor(auser.exp / maxExp) + 1;
			const dropRate = baseDropRate + (userLevelDropRateIncrease * userLevel / (1 + userLevel));
			if(Math.random() < dropRate) {
				const droppedSkill = makeWeightedDecision(skillOptions);
				auser.skills[droppedSkill.key] ??= 0;
				auser.skills[droppedSkill.key]++;
				auser.markModified('skills');
			}
			auser.exp++;
			await auser.save();
	
			const wasCorrected = originalX !== correctedX || originalY !== correctedY;
			reactIfMessage(wasCorrected ? '☑️' : '✅');
			embeds.push(new EmbedBuilder()
				.setColor(Colors.DarkVividPink)
				.setTitle('¡Hecho!')
				.setDescription(
					(wasCorrected
						? '☑️ Emote[s] colocado[s] con *posición corregida*'
						: '✅ Emote[s] colocado[s]'
					).replace(/\[s\]/g, skill ? 's' : '')));
	
			if((auser.exp % maxExp) == 0) {
				embeds.push(new EmbedBuilder()
					.setColor(Colors.Gold)
					.setTitle('¡Subida de nivel!')
					.setDescription(`${request.user} subió a nivel **${userLevel + 1}**`));
			}
		} else
			await request.deferReply();

		//Ver tabla
		const canvas = createCanvas(864, 996);
		const ctx = canvas.getContext('2d');

		ctx.drawImage(pureTableImage, 0, 0, canvas.width, canvas.height);

		//Encabezado
		ctx.fillStyle = '#ffffff';
		ctx.textBaseline = 'top';
		ctx.font = `bold 116px "headline"`;

		//Dibujar emotes en imagen
		const pureTable = (await Puretable.findOne({})).cells;
		const emoteSize = 48;
		const tableX = canvas.width / 2 - emoteSize * pureTable.length / 2;
		const tableY = ctx.measureText('M').actualBoundingBoxDescent + 65;
		pureTable.map((arr, y) => {
			arr.map((item, x) => {
				ctx.drawImage(loadEmotes[item], tableX + x * emoteSize, tableY + y * emoteSize, emoteSize, emoteSize);
			});
		});
		
		const imagen = new AttachmentBuilder(canvas.toBuffer(), { name: 'anarquia.png' });
		return request.editReply({ embeds, files: [imagen] });
	})
	.setButtonResponse(async function cancel(interaction) {
		return interaction.deleteReply();
	}, { userFilterIndex: 0 });

/**
 * @param {Array<Array<string>>} puretable La tabla de p!anarquía
 * @param {string} id Una ID de emoji con la cual usar la skill
 * @param {{x: number, y: number}} position La posición central donde se utiliza la skill en el tablero
 * @param {Array<Array<number>>} mask Una matriz máscara centrada a la posición indicada para determinar dónde colocar emotes
 */
function useSkill(puretable, id, position, mask) {
	const ptH = puretable.length;
	const ptW = puretable[0].length;
	const maskH = mask.length;
	const maskW = mask[0].length;

	const startX = position.x - Math.floor(maskW / 2);
	const startY = position.y - Math.floor(maskH / 2);

	const maskX1 = Math.max(0, -startX);
	const maskX2 = Math.min(maskW, ptW - startX);
	const maskY1 = Math.max(0, -startY);
	const maskY2 = Math.min(maskH, ptH - startY);

	for(let i = maskY1; i < maskY2; i++) {
		for(let j = maskX1; j < maskX2; j++) {
			const ptX = startX + j;
			const ptY = startY + i;

			if(mask[i][j] === 1)
				puretable[ptY][ptX] = id;
		}
	}
}

module.exports = command;