const { shortenText } = require('./func');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const { TuberLexer } = require('./pslexer.js');
const { TuberParser } = require('./psparser.js');
const { TuberInterpreter } = require('./psinterpreter.js');
const { declareNatives, declareContext } = require('./psnatives.js');
const { TuberScope } = require('./psscope.js');
const { makeValue } = require('./commons.js');

const logOptions = {
	lexer: false,
	parser: false,
	interpreter: false,
};

//#region Esqueleto de PuréScript
/**
 * @typedef {Object} TuberExecutionInputs
 * @property {String} name
 * @property {import('./commons.js').RuntimeType} type
 * @property {Boolean} required
 * @property {String} [desc]
 */
/**
 * @typedef {Object} BaseTubercle
 * @property {String} tuberId
 * @property {String} author
 * @property {Array<TuberExecutionInputs>} [inputs]
 */
/**
 * @typedef {Object} PartialBasicTubercleData
 * @property {String?} [content]
 * @property {Array<String>} [files]
 * @typedef {import('./util').RequireAtLeastOne<PartialBasicTubercleData>} BasicTubercleData
 */
/**
 * @typedef {Object} AdvancedTubercleData
 * @property {undefined} [content]
 * @property {undefined} [files]
 * @property {String} script
 */
/**
 * @typedef {BaseTubercle & BasicTubercleData} BasicTubercle
 * @typedef {BaseTubercle & AdvancedTubercleData} AdvancedTubercle
 */
/**
 * @typedef {BasicTubercle | AdvancedTubercle} Tubercle
 */
/**
 *
 * @param {Tubercle} tuber
 * @returns {tuber is AdvancedTubercle}
 */
function isAdvanced(tuber) {
	return tuber.content == null
        && tuber.files == null
        && /**@type {AdvancedTubercle}*/(tuber).script != null;
}

/**
 * @typedef {Object} TuberExecutionOptions
 * @property {Array<String>} [args]
 * @property {Boolean} [overwrite]
 * @property {Boolean} [isTestDrive]
 */
/**
 * Evalua el tipo de Tubérculo (básico o avanzado) y lo ejecuta. Si es avanzado, se ejecutará con PuréScript
 * @function
 * @param {import("../../../types/commands").ComplexCommandRequest} request
 * @param {Tubercle} tuber
 * @param {TuberExecutionOptions} [inputOptions]
 */
async function executeTuber(request, tuber, inputOptions) {
	inputOptions ??= {};
	const overwrite = inputOptions.overwrite ?? true;
	const { args, isTestDrive } = inputOptions;

	if(!isAdvanced(tuber))
		return request.editReply({
			//@ts-expect-error Compatibilidad
			content: tuber.content,
			//@ts-expect-error Compatibilidad
			files: tuber.files,
		}).catch(console.error);

	let result;
	try {
		const lexer = new TuberLexer();
		const tokens = lexer.tokenize(tuber.script);
		logOptions.lexer && console.table(tokens.map(token => ({ ...token, value: (typeof token.value === 'string') ? shortenText(token.value, 32, '[...]') : token.value })));

		const parser = new TuberParser(tokens);
		const program = parser.parse();
		logOptions.parser && console.log('Bloque Programa:');
		logOptions.parser && console.dir(program, { depth: null });

		const scope = new TuberScope();
		declareNatives(scope);
		await declareContext(scope, request, tuber, args);

		const interpreter = new TuberInterpreter();
		result = interpreter.evaluateProgram(program, scope, request, isTestDrive);
		if(!result.sendStack.length) {
			const error = Error('No se envió ningún mensaje');
			error.name = 'TuberSendError';
			throw error;
		}
		logOptions.interpreter && console.log('Resultado:');
		logOptions.interpreter && console.dir(result, { depth: null });
	} catch(error) {
		const errorNames = {
			'TuberVersionError':     'Error de versión',
			'TuberInitializerError': 'Error de inicialización',
			'TuberLexerError':       'Error léxico',
			'TuberParserError':      'Error de análisis',
			'TuberInterpreterError': 'Error de interpretación',
			'TuberSendError':        'Error de envío',
		};
		const fieldName = errorNames[error.name] ?? 'Ocurrió un error inesperado';

		const replyContent = {};
		const embed = new EmbedBuilder()
			.setTitle(`⚠️ ${error.name}`)
			.setAuthor({
				name: 'Error de PuréScript',
				iconURL: request.client.user.avatarURL({ size: 128 })
			})
			.addFields({
				name: fieldName,
				value: `\`\`\`\n${error.message || 'Este error no tiene descripción'}\n\`\`\``,
			});

		if(!errorNames[error.name]) {
			console.error(error);
			embed.setColor(0x0000ff)
				.addFields({
					name: 'Puede que este error no sea tu culpa',
					value: 'Este error es un error inesperado. Estos son errores del lenguaje mismo, y deberías reportarlos a Papita con Puré#6932',
				});
		} else if(error.name === 'TuberInitializerError') {
			embed.setColor(Colors.Yellow);
			if(tuber.tuberId)
				replyContent.components = [ new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`tubérculo_getTuberHelp_${tuber.tuberId}`)
						.setLabel('Ver Tubérculo')
						.setEmoji('🔎')
						.setStyle(ButtonStyle.Primary),
				) ];
		} else
			embed.setColor(Colors.Red);

		replyContent.embeds = [ embed ];
		await request.editReply(replyContent);
		throw error;
	}

	let { sendStack, inputStack } = result;

	if(!sendStack.length) {
		await request.editReply({ content: `⚠️ Se esperaba un envío de mensaje` });
		throw Error('Se esperaba un envío de mensaje');
	}

	const replyObject = {
		content: [],
		embeds: [],
	};

	for(const sendItem of sendStack) {
		switch(sendItem.type) {
		case 'Number':
		case 'Text':
		case 'Boolean':
		case 'List':
		case 'Glossary':
			replyObject.content.push(makeValue(sendItem, 'Text').value);
			break;
		case 'Embed':
			replyObject.embeds.push(sendItem.value);
		}
	}

	if(replyObject.content.length)
        //@ts-expect-error Transformar a string
		replyObject.content = replyObject.content.join('\n');
	else
		delete replyObject.content;

	if(overwrite)
        //@ts-expect-error Si bien el tipo no está bien notado, esto es correcto
		tuber.inputs = inputStack;

	return request.editReply(/**@type {import('../../../types/commands').CommandEditReplyOptions}*/(/**@type {unknown}*/(replyObject))).catch(async () => {
		await request.editReply({ content: `⚠️ No se puede enviar el mensaje. Revisa el largo y la validez de los datos` });
		throw Error('Envío inválido');
	});
}

module.exports = {
	TuberLexer,
	TuberParser,
	TuberInterpreter,
	executeTuber,
};
