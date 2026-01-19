import { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { shortenText } from '../../../func';
import DiscordEnvironmentProvider from './discordEnvironmentProvider';
import sizeof from 'object-sizeof';
import { Input } from '../v1.1';
import { InputJSONData } from '../v1.1/interpreter/inputReader';
import { RequireAtLeastOne } from 'types';
import { RuntimeValue } from '../v1.1/interpreter/values';
import { ComplexCommandRequest } from '../../../commands/Commons/typings.js';
import { EvaluationResult } from '../v1.1/interpreter';
import { EmbedData } from '../v1.1/embedData';

export const CURRENT_PS_VERSION = 1.11;

const VERSIONS = ({
	1.1: '../v1.1',
}) as const;

export function tangibleVersion(version: number): keyof typeof VERSIONS {
	return Math.floor(version * 10) / 10 as keyof typeof VERSIONS;
}

const LOG_OPTIONS = {
	lexer: true,
	parser: true,
	interpreter: true,
};

/**
 * @description
 * Esta Función se ejecuta DESPUÉS de comprobar que ambas variantes tienen el mismo largo.
 * Verifica si todas las Entradas de la variante A se corresponden suficientemente con las Entradas de la variante B.
 * Si un par de Entradas coinciden en nombre, tipo y opcionalidad pero no en extensividad, se hacen ambas extensivos y se consideran equivalentes.
 */
const variantEquals = (a: Input[], b: Input[]) => a.every((input1, i) => {
	const input2 = b[i];
	if(!input1.equals(input2))
		return false;

	if(input1.spread !== input2.spread) {
		input1.setSpread(true);
		input2.setSpread(true);
	}

	return true;
});

export interface BaseTubercle {
	id: string;
	author: string;
	inputs?: InputJSONData[][];
}

export interface PartialBasicTubercleData {
	advanced: false;
	content?: string;
	files?: string[];
}

export type BasicTubercleData = RequireAtLeastOne<PartialBasicTubercleData>;

export interface AdvancedTubercleData {
	advanced: true;
	content?: undefined;
	files?: undefined;
	script: string;
	saved: Map<string, RuntimeValue>;
	psVersion: number;
}

export type BasicTubercle = BaseTubercle & BasicTubercleData;

export type AdvancedTubercle = BaseTubercle & AdvancedTubercleData;

export type Tubercle = BasicTubercle | AdvancedTubercle;

export interface TuberExecutionOptions {
	args?: string[];
	isTestDrive?: boolean;
	overwrite?: boolean;
	savedData?: Map<string, RuntimeValue>;
}

/**@description Evalua el tipo de Tubérculo (básico o avanzado) y lo ejecuta. Si es avanzado, se ejecutará con PuréScript.*/
export async function executeTuber(request: ComplexCommandRequest, tuber: Tubercle, inputOptions: TuberExecutionOptions = {}) {
	const {
		isTestDrive = false,
		overwrite = true,
		savedData = null,
	} = inputOptions;
	const args = inputOptions.args;

	if(!tuber.advanced) {
		await request.editReply({
			content: tuber.content,
			files: tuber.files,
		}).catch(console.error);
		return { kind: 'Nada', value: null };
	}

	const version = VERSIONS[tangibleVersion(tuber.psVersion)];
	const versionModule = await import('../v1.1');
	const {
		Lexer,
		Parser,
		Interpreter,
		Scope,
		Input,
		declareNatives,
		declareContext,
		coerceValue,
		ValueKinds,
		stringifyPSAST,
	} = versionModule;

	const lexer = new Lexer();
	const parser = new Parser();
	const interpreter = new Interpreter();

	let result: EvaluationResult;
	try {
		if(!version)
			throw TuberVersionError(`Este Tubérculo fue creado con la versión **${tuber.psVersion}** de PuréScript, la cual ya no tiene soporte. La versión más reciente de PuréScript es **${CURRENT_PS_VERSION}**. Si eres el creador, puedes actualizar el Tubérculo u eliminarlo. Si no, avísale al creador`);

		const tokens = lexer.tokenize(tuber.script);
		LOG_OPTIONS.lexer && console.table(tokens.map(token => ({ ...token, value: (typeof token.value === 'string') ? shortenText(token.value, 32, '[...]') : token.value })));

		const program = parser.parse(tokens);
		LOG_OPTIONS.interpreter && console.log(`Bloque programa: ${stringifyPSAST(program, 2)}`);

		const scope = new Scope(interpreter);
		const envProvider = new DiscordEnvironmentProvider(request);
		await envProvider.prefetchOwner();
		declareNatives(scope);
		await declareContext(scope, envProvider, savedData);
		result = interpreter.evaluateProgram(program, scope, tuber.script, envProvider, args, isTestDrive);
		if(!result.sendStack.length)
			throw interpreter.TuberSendError('No se envió ningún mensaje');
		LOG_OPTIONS.interpreter && console.log(`Resultado: ${stringifyPSAST(result)}`);
	} catch(error) {
		const errorNames = {
			'TuberVersionError':     { color: Colors.Greyple, icon: '🏚️', translation: `Se requiere actualizar PuréScript: ${tuber.psVersion} → ${CURRENT_PS_VERSION}` },
			'TuberInputError':       { color: Colors.Blue,    icon: '📥', translation: 'Problema de Entrada de Usuario' },
			'TuberLexerError':       { color: Colors.Yellow,  icon: '⚠️', translation: 'Error en tiempo de análisis léxico' },
			'TuberParserError':      { color: Colors.Orange,  icon: '⚠️', translation: 'Error en tiempo de análisis sintáctico' },
			'TuberInterpreterError': { color: Colors.Red,     icon: '⚠️', translation: 'Error en tiempo de ejecución' },
			'TuberSendError':        { color: Colors.Orange,  icon: '❌', translation: 'Error de envío' },
		};
		const err = errorNames[error.name];
		const errorColor = err?.color ?? 0x0000ff;
		const errorIcon = err?.icon ?? '❓';
		const errorName = err?.translation ?? 'Ocurrió un error inesperado';

		const replyContent: Record<string, unknown> = {};
		const embed = new EmbedBuilder()
			.setTitle(`${errorIcon} ${error.name}`)
			.setColor(errorColor)
			.setAuthor({
				name: 'Error de PuréScript',
				iconURL: request.client.user.avatarURL({ size: 128 })
			})
			.addFields({
				name: errorName,
				value: `${error.message || '_Este error no tiene descripción_'}`,
			});

		if(!errorNames[error.name]) {
			console.error(error);
			embed.addFields({
				name: 'Puede que este error no sea tu culpa',
				value: 'Este error es un error inesperado. Estos son errores del lenguaje mismo, y deberías reportarlos a Papita con Puré#6932',
			});
		} else if(error.name === 'TuberInputError') {
			if(tuber.id)
				replyContent.components = [ new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`tubérculo_getTuberHelp_${tuber.id}_0`)
						.setLabel('Ver Tubérculo')
						.setEmoji('🔎')
						.setStyle(ButtonStyle.Primary),
				) ];
		}

		replyContent.embeds = [ embed ];
		await request.editReply(replyContent);
		throw error;
	}

	const { sendStack, inputStack: newInputVariant, saveTable, returned } = result;

	if(!sendStack.length) {
		await request.editReply({ content: `⚠️ Se esperaba un envío de mensaje` });
		throw Error('Se esperaba un envío de mensaje');
	}

	const replyStacks = {
		content: [],
		embeds: [],
	};

	for(const sendItem of sendStack) {
		switch(sendItem.kind) {
		case ValueKinds.EMBED:
			replyStacks.embeds.push(convertToDiscordEmbed(sendItem.value));
			break;
		default:
			replyStacks.content.push(coerceValue(interpreter, sendItem, 'Text').value);
			break;
		}
	}

	const replyObject = {
		content: null as string,
		embeds: replyStacks.embeds,
	};

	if(replyStacks.content.length)
		replyObject.content = replyStacks.content.join('\n');

	if(overwrite) {
		tuber.inputs = [ newInputVariant ];
	} else {
		tuber.inputs ??= [];
		const savedVariants = tuber.inputs.map(variant => variant.map(i => Input.from(i)));

		const isNewVariant = () => {
			if(savedVariants.length === 0)
				return true;

			if(newInputVariant.length === 0)
				return !savedVariants.some(savedVariant => savedVariant.length === 0);

			return !savedVariants.some(savedVariant => newInputVariant.length === savedVariant.length && variantEquals(newInputVariant, savedVariant));
		};

		if(isNewVariant()) {
			newInputVariant.forEach(newInput => savedVariants.some(savedVariant => savedVariant.some(savedInput => {
				if(newInput.name !== savedInput.name)
					return false;

				newInput.setDesc(savedInput.desc);
				return true;
			})));

			savedVariants.push(newInputVariant);

			tuber.inputs = savedVariants;
			tuber.inputs.sort((a, b) => a.length - b.length);
		}
	}

	let mergedSaveData: Map<string, RuntimeValue>;
	if(typeof tuber.saved === 'object')
		mergedSaveData = new Map(Object.entries(tuber.saved));
	else
		mergedSaveData = new Map();

	for(const [ id, value ] of saveTable)
		if(value.kind === ValueKinds.NADA)
			mergedSaveData.delete(id);
		else
			mergedSaveData.set(id, value);

	const maxKiBytes = 128;
	const savedBytes = sizeof(mergedSaveData);
	if(savedBytes >= maxKiBytes * 1024) {
		return sendDatabaseError(request,
			`Límite de tamaño de guardado excedido. Los datos que se guardan no deben superar los **${maxKiBytes}KiB**\nTu Tubérculo guarda un total de **${savedBytes / 1024}KiB** en datos propios`);
	} else
		console.log(`Saved data was ${(savedBytes / 1024).toFixed(2)}KiB / ${maxKiBytes.toFixed(2)}KiB`);

	tuber.saved = mergedSaveData;

	await request.editReply(replyObject).catch(async () => {
		await request.editReply({ content: `⚠️ No se puede enviar el mensaje. Revisa el largo y la validez de los datos` });
		throw Error('Envío inválido');
	});

	return returned;
}

function convertToDiscordEmbed(embedData: EmbedData): EmbedBuilder {
	const embed = new EmbedBuilder();
	const data = embedData.data;

	if(data.author)
		embed.setAuthor({
			name: data.author.name,
			iconURL: data.author.iconUrl,
			url: data.author.url,
		});

	if(data.color)
		embed.setColor(data.color);

	if(data.description)
		embed.setDescription(data.description);

	if(data.fields?.length)
		embed.addFields(...data.fields);

	if(data.footer)
		embed.setFooter({
			text: data.footer.text,
			iconURL: data.footer.iconUrl,
		});

	if(data.imageUrl)
		embed.setImage(data.imageUrl);

	if(data.thumbUrl)
		embed.setThumbnail(data.thumbUrl);

	if(data.timestamp)
		embed.setTimestamp(data.timestamp);

	if(data.title)
		embed.setTitle(data.title);

	if(data.url)
		embed.setURL(data.url);

	return embed;
}

function TuberVersionError(message?: string) {
	const err = new Error(message);
	err.name = 'TuberVersionError';
	return err;
}

/**
 * @param {ComplexCommandRequest} request
 */
function sendDatabaseError(request: ComplexCommandRequest, message = '_Este error no tiene descripción_') {
	const embed = new EmbedBuilder()
		.setTitle(`🧳 TuberDatabaseError`)
		.setColor(0x9b59b6)
		.setAuthor({
			name: 'Error de PuréScript',
			iconURL: request.client.user.avatarURL({ size: 128 })
		})
		.addFields({
			name: 'Error de Guardado de Base de Datos',
			value: message,
		});

	return request.editReply({ embeds: [ embed ] });
}
