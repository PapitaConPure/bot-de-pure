import { CommandOptions, CommandTags, Command, CommandOptionSolver } from '../commons';
import { makeWeightedDecision, compressId, decompressId, improveNumber, emojiRegex, WeightedDecision } from '@/func';
import { EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, AnySelectMenuInteraction } from 'discord.js';
import { PureTable, AnarchyUser, pureTableAssets, AnarchyUserDocument } from '@/models/puretable';
import { createTaskScheduler } from '@/utils/concurrency';
import type { ComplexCommandRequest } from 'types/commands';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { globalConfigs } from '@/data/globalProps';
import { p_pure } from '@/utils/prefixes';
import { Translator } from '@/i18n';
import Ut from '@/utils/general';

const ptTaskScheduler = createTaskScheduler();

interface Skill {
	readonly name: string;
	readonly emoji: string;
	readonly weight: number;
	readonly shape: number[][];
}

const skills: Record<string, Skill> = ({
	hline: {
		name: 'Habilidad Horizontal',
		emoji: '↔️',
		weight: 4.00,
		shape: [ Array(32).fill(1) ], //Cappeado a 16 emojis
	} as Skill,
	vline: {
		name: 'Habilidad Vertical',
		emoji: '↕️',
		weight: 4.00,
		shape: Array(32).fill([ 1 ]), //Cappeado a 16 emojis
	} as Skill,
	x: {
		name: 'Habilidad Cruzada',
		emoji: '❌',
		weight: 3.00,
		shape: [ //17 emojis
			[ 1,  ,  ,  ,  ,  ,  ,  , 1, ],
			[  , 1,  ,  ,  ,  ,  , 1,  , ],
			[  ,  , 1,  ,  ,  , 1,  ,  , ],
			[  ,  ,  , 1,  , 1,  ,  ,  , ],
			[  ,  ,  ,  , 1,  ,  ,  ,  , ],
			[  ,  ,  , 1,  , 1,  ,  ,  , ],
			[  ,  , 1,  ,  ,  , 1,  ,  , ],
			[  , 1,  ,  ,  ,  ,  , 1,  , ],
			[ 1,  ,  ,  ,  ,  ,  ,  , 1, ],
		],
	} as Skill,
	square: {
		name: 'Habilidad Cuadrada',
		emoji: '🟥',
		weight: 3.50,
		shape: [ //16 emojis
			[ 1, 1, 1, 1, 1, ],
			[ 1,  ,  ,  , 1, ],
			[ 1,  ,  ,  , 1, ],
			[ 1,  ,  ,  , 1, ],
			[ 1, 1, 1, 1, 1, ],
		],
	} as Skill,
	circle: {
		name: 'Habilidad Circular',
		emoji: '🔵',
		weight: 3.25,
		shape: [ //16 emojis
			[  ,  , 1, 1, 1,  ,  , ],
			[  , 1,  ,  ,  , 1,  , ],
			[ 1,  ,  ,  ,  ,  , 1, ],
			[ 1,  ,  ,  ,  ,  , 1, ],
			[ 1,  ,  ,  ,  ,  , 1, ],
			[  , 1,  ,  ,  , 1,  , ],
			[  ,  , 1, 1, 1,  ,  , ],
		],
	} as Skill,
	diamond: {
		name: 'Habilidad Diamante',
		emoji: '💎',
		weight: 3.75,
		shape: [ //12 emojis
			[  ,  ,  , 1,  ,  ,  , ],
			[  ,  , 1,  , 1,  ,  , ],
			[  , 1,  ,  ,  , 1,  , ],
			[ 1,  ,  ,  ,  ,  , 1, ],
			[  , 1,  ,  ,  , 1,  , ],
			[  ,  , 1,  , 1,  ,  , ],
			[  ,  ,  , 1,  ,  ,  , ],
		],
	} as Skill,
	heart: {
		name: 'Habilidad Corazón',
		emoji: '❤️',
		weight: 3.10,
		shape: [ //16 emojis
			[  , 1, 1,  , 1, 1,  , ],
			[ 1,  ,  , 1,  ,  , 1, ],
			[ 1,  ,  ,  ,  ,  , 1, ],
			[ 1,  ,  ,  ,  ,  , 1, ],
			[  , 1,  ,  ,  , 1,  , ],
			[  ,  , 1,  , 1,  ,  , ],
			[  ,  ,  , 1,  ,  ,  , ],
		],
	} as Skill,
	tetris: {
		name: 'Habilidad Tetrápeda',
		emoji: '🕹️',
		weight: 3.00,
		shape: [ //16 emojis
			[ 1, 1,  ,  ,  ,  ,  , ],
			[ 1,  ,  ,  , 1, 1,  , ],
			[ 1,  ,  , 1, 1,  ,  , ],
			[  ,  ,  ,  ,  ,  , 1, ],
			[  ,  , 1,  ,  ,  , 1, ],
			[  , 1, 1, 1,  ,  , 1, ],
			[  ,  ,  ,  ,  ,  , 1, ],
		],
	} as Skill,
	p: {
		name: 'Habilidad Tubércula',
		emoji: '🥔',
		weight: 3.25,
		shape: [ //16 emojis
			[ 1, 1, 1, 1,  , ],
			[  , 1,  ,  , 1, ],
			[  , 1,  ,  , 1, ],
			[  , 1, 1, 1,  , ],
			[  , 1,  ,  ,  , ],
			[  , 1,  ,  ,  , ],
			[ 1, 1, 1,  ,  , ],
		],
	} as Skill,
	exclamation: {
		name: 'Habilidad Exclamativa',
		emoji: '❗',
		weight: 2.50,
		shape: [ //22 emojis
			[  , 1, 1,  , ],
			[ 1, 1, 1, 1, ],
			[ 1, 1, 1, 1, ],
			[ 1, 1, 1, 1, ],
			[  , 1, 1,  , ],
			[  , 1, 1,  , ],
			[  ,  ,  ,  , ],
			[  , 1, 1,  , ],
			[  , 1, 1,  , ],
		],
	} as Skill,
	a: {
		name: 'Habilidad Anárquica',
		emoji: '🅰',
		weight: 3.25,
		shape: [ //16 emojis
			[  ,  , 1,  ,  , ],
			[  , 1,  , 1,  , ],
			[  , 1,  , 1,  , ],
			[ 1,  ,  ,  , 1, ],
			[ 1, 1, 1, 1, 1, ],
			[ 1,  ,  ,  , 1, ],
			[ 1,  ,  ,  , 1, ],
		],
	} as Skill,
	ultimate: {
		name: 'Habilidad Definitiva',
		emoji: '👑',
		weight: 1.00,
		shape: [ //52 emojis
			[  ,  , 1, 1, 1, 1, 1,  ,  , ],
			[  , 1, 1,  , 1,  , 1, 1,  , ],
			[ 1, 1,  ,  , 1, 1,  , 1, 1, ],
			[ 1,  , 1, 1, 1, 1,  ,  , 1, ],
			[ 1, 1, 1, 1,  , 1, 1, 1, 1, ],
			[ 1,  ,  , 1, 1, 1, 1,  , 1, ],
			[ 1, 1,  , 1, 1,  ,  , 1, 1, ],
			[  , 1, 1,  , 1,  , 1, 1,  , ],
			[  ,  , 1, 1, 1, 1, 1,  ,  , ],
		],
	} as Skill,
}) as const;

interface SkillOption {
	key: string,
	skill: Skill,
}
type WeightedSkillOption = WeightedDecision<SkillOption>;
const skillOptions: WeightedSkillOption[] = Object.entries(skills).map(([ key, skill ]) => ({ weight: skill.weight, value: { key, skill } }));

const baseDropRate = 0.02; //La chance de drop base, incrementada con las propiedades de abajo según el nivel de usuario
const userLevelDropRateMaxIncrease = 0.5; //El máximo hacia el cual tiende el incremento por nivel de usuario
const userLevelDropRateHalfIncreaseLength = 100; //El nivel de usuario en el cual se alcanza la mitad del incremento máximo
const maxExp = 20; //Cantidad de experiencia requerida para subir de nivel

const options = new CommandOptions()
	.addParam('posición', 'NUMBER', 'para especificar una celda a modificar', { poly: [ 'x', 'y' ], optional: true })
	.addParam('emote',    'EMOTE',  'para especificar un emote a agregar',    {                     optional: true })
	.addFlag('p', 'perfil', 'para ver tu perfil anárquico')
	.addFlag('sh', [ 'skill', 'habilidad', 'especial', 'special' ], 'para usar una habilidad especial');

const tags = new CommandTags().add(
	'COMMON',
	'GAME',
);

const command = new Command('anarquia', tags)
	.setAliases('anarquía', 'a')
	.setBriefDescription('Para interactuar con la Tabla de Puré')
	.setLongDescription(
		'Para interactuar con la __Tabla de Puré__\n' +
		'**Tabla de Puré**: tablero de 16x16 celdas de emotes ingresados por usuarios de cualquier server\n\n' +
		'Puedes ingresar un `<emote>` en una `<posición(x,y)>` o, al no ingresar nada, ver la tabla\n' +
		'La `<posicion(x,y)>` se cuenta desde 1x,1y, y el `<emote>` designado debe ser de un server del que yo forme parte~\n\n' +
		'De forma aleatoria, puedes ir desbloqueando habilidades para rellenar líneas completas en `--horizontal` o `--vertical`. La probabilidad inicial es 1% en conjunto, y aumenta +1% por cada __nivel__\n' +
		`**Nivel**: nivel de usuario en minijuego Anarquía. +1 por cada *${maxExp} usos*\n\n` +
		'Incluso si usas una habilidad de línea, debes ingresar ambos ejes (`x,y`) en orden\n' +
		`Ingresa únicamente \`p\` para ver tu perfil anárquico`
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.user);

		//Revisar perfil
		const perfil = args.hasFlag('perfil');
		if(perfil) {
			const { user, member, userId } = request;
			const auser = await AnarchyUser.findOne({ userId });

			const embed = new EmbedBuilder()
				.setColor(0xbd0924)
				.setAuthor({ name: user.username, iconURL: member.displayAvatarURL({ extension: 'png', size: 512 }) });
			if(auser) {
				const skillContent = Object.entries(auser.skills)
					.sort(([ , amountA ], [ , amountB ]) => amountB - amountA)
					.map(([ key, amount ]) => {
						const skill = skills[key as keyof typeof skills];
						if(!skill) return;

						const decor = !amount ? '~~' : '';

						return `${decor}${skill.emoji} x **${amount}**${decor}`;
					})
					.filter(s => s)
					.join('\n');

				const exp = auser.exp % maxExp;
				const userLevel = calcUserLevel(auser);
				const dropRate = calcDropRate(userLevel);
				const progress = exp / maxExp;
				const progressBarLength = 6;
				const progressChars = Math.round(progressBarLength * progress);
				const emptyChars = progressBarLength - progressChars;
				const progressBar = '▰'.repeat(progressChars) + '▱'.repeat(emptyChars);
				embed
					.setTitle('Perfil anárquico')
					.addFields(
						{
							name: 'Inventario',
							value: skillContent || '_Todavía no has obtenido nada_',
							inline: true,
						},
						{
							name: 'Rango',
							value: [
								`Nivel ${userLevel}`,

								'**Experiencia**',
								`${exp} / ${maxExp}`,
								progressBar,

								'**Eficiencia**',
								`${improveNumber(dropRate * 100)}%`,
							].join('\n'),
							inline: true,
						},
					);
			} else
				embed.setTitle('Perfil inexistente')
					.addFields({
						name: 'Este perfil anárquico no existe todavía',
						value:
							`Usa \`${p_pure(request.guildId).raw}anarquia <posición(x,y)> <emote>\` para colocar un emote en la tabla de puré y crearte un perfil anárquico automáticamente\n` +
							`Si tienes más dudas, usa \`${p_pure(request.guildId).raw}ayuda anarquia\``
					});
			return request.reply({ embeds: [ embed ] });
		}

		const reactIfMessage = async (/**@type {String}*/ reaction: string) => request.isMessage && request.inferAsMessage().react(reaction).catch(_ => _);

		const skill = args.hasFlag('skill');
		const inverted = args.isMessageSolver(args.args) && isNaN(+args.args[0]);
		let emote: string;
		if(inverted) emote = args.getString('emote');
		const pos = CommandOptionSolver.asNumbers(args.parsePolyParamSync('posición', { regroupMethod: 'NONE' })).filter(x => !isNaN(x));
		if(!inverted) emote = args.getString('emote');

		if((pos.length === 2 && !emote)
		|| (pos.length  <  2 && (emote || skill))
		|| (pos.length !== 2 && pos.length > 0)) {
			reactIfMessage('⚠️');
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('invalidInput'),
			});
		}

		let cells;
		const embeds: EmbedBuilder[] = [];

		//Ingresar emotes a tabla
		if(pos.length) {
			const { userId } = request;
			const auser = (await AnarchyUser.findOne({ userId })) || new AnarchyUser({ userId });

			//Tiempo de enfriamiento por usuario
			if((Date.now() - auser.last) < 5000) {
				reactIfMessage('⌛');
				return request.reply({ content: '⌛ ¡No tan rápido!', ephemeral: true });
			} else
				auser.last = Date.now();

			const emoteMatch = emote.match(emojiRegex);
			if(!emoteMatch) {
				reactIfMessage('⚠️');
				return request.reply({ content: translator.getText('invalidEmoji'), ephemeral: true });
			}
			const emoteId = emoteMatch[1];

			if(!request.client.emojis.cache.has(emoteId)) {
				reactIfMessage('⚠️');
				return request.reply({ content: '⚠️️ No reconozco ese emoji. Solo puedo usar emojis de servidores en los que esté', ephemeral: true });
			}

			await request.deferReply();

			//Posición de emote
			const originalX = Math.floor(pos[0]) - 1;
			const originalY = Math.floor(pos[1]) - 1;

			if(skill) {
				cells = await fetchPureTableCells();
				const correctedX = Ut.clamp(originalX, 0, cells[0].length - 1);
				const correctedY = Ut.clamp(originalY, 0, cells.length - 1);
				return makeSkillSelectReply(request, translator, auser, [ correctedX, correctedY ], emoteId);
			}

			let couldLoadEmote;
			let wasCorrected;
			await ptTaskScheduler.scheduleTask(async () => {
				cells = await fetchPureTableCells();
				const correctedX = Ut.clamp(originalX, 0, cells[0].length - 1);
				const correctedY = Ut.clamp(originalY, 0, cells.length - 1);
				wasCorrected = originalX !== correctedX || originalY !== correctedY;

				//Insertar emote en posición
				couldLoadEmote = await loadEmoteIfNotLoaded(request, emoteId);
				if(couldLoadEmote) {
					cells[correctedY][correctedX] = emoteId;
					await PureTable.updateOne({}, { cells });
				}
			});

			if(!couldLoadEmote) {
				reactIfMessage('⚠️');
				return request.reply({ content: translator.getText('anarquiaCouldNotLoadEmoji'), ephemeral: true });
			}

			reactIfMessage(wasCorrected ? '☑️' : '✅');
			embeds.push(new EmbedBuilder()
				.setColor(Colors.DarkVividPink)
				.setTitle('¡Hecho!')
				.setDescription(
					(wasCorrected
						? '☑️ Emote colocado con *posición corregida*'
						: '✅ Emote colocado'
					)));

			//Sistema de nivel de jugador y adquisición de habilidades
			const { userLevel, leveledUp, droppedSkill } = levelUpAndGetSkills(auser);
			auser.markModified('skills');
			auser.save();

			if(leveledUp) {
				reactIfMessage('✨');
				embeds.push(new EmbedBuilder()
					.setColor(Colors.Gold)
					.setTitle('¡Subida de nivel!')
					.setDescription(`✨ ${request.user} subió a nivel **${userLevel}**`));
			}

			if(droppedSkill) {
				reactIfMessage(droppedSkill.emoji);
				embeds.push(new EmbedBuilder()
					.setColor(Colors.Gold)
					.setTitle('¡Habilidad especial obtenida!')
					.setDescription(`${request.user} obtuvo **1** x ${droppedSkill.emoji} *${droppedSkill.name}*`));
			}
		} else {
			[ cells ] = await Promise.all([
				fetchPureTableCells(),
				request.deferReply(),
			]);
		}

		//Ver tabla
		const imagen = await drawPureTable(cells);
		return request.editReply({ embeds, files: [ imagen ] });
	})
	.setSelectMenuResponse(async function selectSkill(interaction, x, y, compressedEmoteId) {
		const translator = await Translator.from(interaction.user);
		const { user } = interaction;
		const userId = user.id;

		const emoteId = decompressId(compressedEmoteId);

		const react = (/**@type {string}*/ reaction: string) => interaction.message.react(reaction);

		const skillKey = /**@type {keyof skills}*/(interaction.values[0]);
		const auser = await AnarchyUser.findOne({ userId });
		if(!auser?.skills[skillKey]) {
			react('❌');
			return interaction.reply({ content: translator.getText('anarquiaSkillIssue'), ephemeral: true });
		}

		const skill = skills[skillKey];
		let cells;
		let couldLoadEmote;

		await ptTaskScheduler.scheduleTask(async () => {
			couldLoadEmote = await loadEmoteIfNotLoaded(interaction, emoteId);
			if(couldLoadEmote) {
				await interaction.deferUpdate();
				cells = await fetchPureTableCells();
				useSkill(cells, +x, +y, emoteId, skill.shape);
				await PureTable.updateOne({}, { cells });
			}
		});

		if(!couldLoadEmote) {
			react('⚠️');
			return interaction.reply({ content: translator.getText('anarquiaCouldNotLoadEmoji'), ephemeral: true });
		}

		const embeds = [];

		react('⚡');
		embeds.push(new EmbedBuilder()
			.setColor(Colors.DarkVividPink)
			.setTitle('Habilidad utilizada')
			.setDescription(`⚡ Se usó la ${skill.name}`));

		const { userLevel, leveledUp, droppedSkill } = levelUpAndGetSkills(auser);
		auser.skills[skillKey]--;
		auser.markModified('skills');
		auser.save();

		if(leveledUp) {
			react('✨');
			embeds.push(new EmbedBuilder()
				.setColor(Colors.Gold)
				.setTitle('¡Subida de nivel!')
				.setDescription(`✨ ${user} subió a nivel **${userLevel}**`));
		}

		if(droppedSkill) {
			react(droppedSkill.emoji);
			embeds.push(new EmbedBuilder()
				.setColor(Colors.Gold)
				.setTitle('¡Habilidad especial obtenida!')
				.setDescription(`${user} obtuvo **1** x ${droppedSkill.emoji} *${droppedSkill.name}*`));
		}

		const imagen = await drawPureTable(cells);
		return interaction.editReply({ embeds, files: [ imagen ], components: [] });
	}, { userFilterIndex: 3 })
	.setButtonResponse(async function cancel(interaction) {
		const translator = await Translator.from(interaction.user);
		return interaction.update({
			embeds: [ new EmbedBuilder().setFooter({ text: translator.getText('cancelledStepFooterName') }) ],
			components: [],
		});
	}, { userFilterIndex: 0 });

export default command;

async function fetchPureTableCells() {
	return (await PureTable.findOne({})).cells;
}

/**@returns Whether the emote could be loaded (`true`) or not (`false`)*/
async function loadEmoteIfNotLoaded(request: ComplexCommandRequest | AnySelectMenuInteraction, emoteId: string): Promise<boolean> {
	const loadEmotes = globalConfigs.loademotes;

	if(!Object.prototype.hasOwnProperty.call(loadEmotes, emoteId)) {
		const imageUrl = request.client.emojis.cache.get(emoteId)?.imageURL({ extension: 'png', size: 64 });
		if(!imageUrl) return false;

		const image = await loadImage(imageUrl);
		if(!image) return false;

		loadEmotes[emoteId] = image;
	}

	return true;
}

async function makeSkillSelectReply(request: ComplexCommandRequest, translator: Translator, auser:  AnarchyUserDocument, position: [number, number], emoteId: string) {
	const userId = request.user.id;
	const authorId = compressId(userId);
	const [ x, y ] = position;

	return request.editReply({
		embeds: [ new EmbedBuilder()
			.setColor(Colors.Fuchsia)
			.setAuthor({ name: request.user.username, iconURL: request.member.displayAvatarURL({ size: 256 })})
			.setTitle('¡A punto de usar una habilidad!')
			.setDescription(`Centrada en la posición (${x + 1}, ${y + 1}) del tablero`)
			.setThumbnail(request.client.emojis.cache.get(emoteId).imageURL({ extension: 'png', size: 512 }))
		],
		components: [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`anarquia_selectSkill_${x}_${y}_${compressId(emoteId)}_${authorId}`)
					.setPlaceholder('Escoge una habilidad...')
					.addOptions(
						Object.entries(skills).map(([ key, skill ]) => ({
							value: key,
							label: `${skill.name} (${auser.skills?.[key] ?? 0})`,
							emoji: skill.emoji,
						}))
					)
			),
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`anarquia_cancel_${authorId}`)
					.setLabel(translator.getText('buttonCancel'))
					.setEmoji('921751138997514290')
					.setStyle(ButtonStyle.Danger)
			),
		],
	});
}

async function drawPureTable(cells: string[][]) {
	const { image: pureTableImage, defaultEmote } = pureTableAssets;
	const loadedEmotes = globalConfigs.loademotes;

	const canvas = createCanvas(864, 996);
	const ctx = canvas.getContext('2d');

	ctx.drawImage(pureTableImage, 0, 0, canvas.width, canvas.height);

	//Encabezado
	ctx.fillStyle = '#ffffff';
	ctx.textBaseline = 'top';
	ctx.font = `bold 116px "headline"`;

	//Dibujar emotes en imagen
	const emoteSize = 48;
	const offsetY = 77; //Compensación - va a variar según la implementación de canvas porque por supuesto que lo hace
	const tableX = canvas.width / 2 - emoteSize * cells.length / 2;
	const tableY = ctx.measureText('M').actualBoundingBoxDescent + offsetY;
	cells.map((arr, y) => {
		arr.map((cell, x) => {
			if(!loadedEmotes[cell])
				loadedEmotes[cell] = defaultEmote;

			ctx.drawImage(loadedEmotes[cell], tableX + x * emoteSize, tableY + y * emoteSize, emoteSize, emoteSize);
		});
	});

	return new AttachmentBuilder(canvas.toBuffer('image/webp'), { name: 'anarquia.webp' });
}

/**
 * @description
 * Sube de nivel al jugador, da la posibilidad de que obtenga habilidades especiales, NO GUARDA el documento
 */
function levelUpAndGetSkills(auser: AnarchyUserDocument) {
	const userLevel = calcUserLevel(auser);
	const dropRate = calcDropRate(userLevel);

	let droppedSkill: { key: string, skill: Skill };
	if(Math.random() < dropRate) {
		droppedSkill = makeWeightedDecision(skillOptions);
		auser.skills[droppedSkill.key] ??= 0;
		auser.skills[droppedSkill.key]++;
	}

	auser.exp++;

	const leveledUp = (auser.exp % maxExp) === 0;
	return {
		leveledUp,
		userLevel: userLevel + 1,
		droppedSkill: droppedSkill?.skill,
	};
}

function calcUserLevel(auser: AnarchyUserDocument) {
	return Math.floor(auser.exp / maxExp) + 1;
}

function calcDropRate(userLevel: number) {
	return baseDropRate + (userLevelDropRateMaxIncrease * userLevel / (userLevelDropRateHalfIncreaseLength + userLevel));
}

/**
 * @param cells La tabla de p!anarquía
 * @param x La posición X central donde se utiliza la skill en el tablero
 * @param y La posición Y central donde se utiliza la skill en el tablero
 * @param id Una ID de emoji con la cual usar la skill
 * @param mask Una matriz máscara centrada a la posición indicada para determinar dónde colocar emotes
 */
function useSkill(cells: string[][], x: number, y: number, id: string, mask: number[][]) {
	const ptH = cells.length;
	const ptW = calcMatrixWidth(cells);
	const maskH = mask.length;
	const maskW = calcMatrixWidth(mask);

	const startX = x - Math.floor(maskW / 2);
	const startY = y - Math.floor(maskH / 2);

	const maskX1 = Math.max(0, -startX);
	const maskX2 = Math.min(maskW, ptW - startX);
	const maskY1 = Math.max(0, -startY);
	const maskY2 = Math.min(maskH, ptH - startY);

	for(let i = maskY1; i < maskY2; i++) {
		for(let j = maskX1; j < maskX2; j++) {
			const ptX = startX + j;
			const ptY = startY + i;

			if(mask[i][j] === 1)
				cells[ptY][ptX] = id;
		}
	}
}

function calcMatrixWidth(matrix: unknown[][]) {
	return matrix.map(r => r.length).reduce((a, b) => a > b ? a : b, 0);
}
