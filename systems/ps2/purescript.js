const { stringifyPSAST, logPSAST } = require('./debug');
const { Token } = require('./lexer/tokens');
const { Lexer } = require('./lexer/lexer');
const { Parser } = require('./parser/parser');
const { Interpreter } = require('./interpreter/interpreter');
const { Scope } = require('./interpreter/scope');
const { Input } = require('../ps2/interpreter/inputReader');
const { ValueKinds, coerceValue, makeNada } = require('./interpreter/values');
const { declareNatives, declareContext } = require('./interpreter/environment/environment');
const { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { shortenText } = require('../../func');
const { default: sizeof } = require('object-sizeof');

const CURRENT_PS_VERSION = 1.1;

const logOptions = {
    lexer: true,
    parser: true,
    interpreter: true,
};

/**
 * @typedef {Object} BaseTubercle
 * @property {String} id
 * @property {String} author
 * @property {Array<Array<*>>} [inputs]
 */

/**
 * @typedef {Object} PartialBasicTubercleData
 * @property {false} advanced
 * @property {String?} [content]
 * @property {Array<String>} [files]
 * @typedef {import('types').RequireAtLeastOne<PartialBasicTubercleData>} BasicTubercleData
 */

/**
 * @typedef {Object} AdvancedTubercleData
 * @property {true} advanced
 * @property {undefined} [content]
 * @property {undefined} [files]
 * @property {String} script
 * @property {Map<String, import('./interpreter/values').RuntimeValue>} saved
 * @property {Number} psVersion
 */

/**
 * @typedef {BaseTubercle & BasicTubercleData} BasicTubercle
 * @typedef {BaseTubercle & AdvancedTubercleData} AdvancedTubercle
 */

/**@typedef {BasicTubercle | AdvancedTubercle} Tubercle*/

const lexer = new Lexer();
const parser = new Parser();
const interpreter = new Interpreter();

/**
 * @typedef {Object} TuberExecutionOptions
 * @property {Array<String>} [args=null]
 * @property {Boolean} [isTestDrive=false]
 * @property {Boolean} [overwrite]
 * @property {Map<String, import('./interpreter/values').RuntimeValue>} [savedData]
 */

/**
 * Evalua el tipo de Tubérculo (básico o avanzado) y lo ejecuta. Si es avanzado, se ejecutará con PuréScript
 * @param {import('../../commands/Commons/typings.js').ComplexCommandRequest} request
 * @param {Tubercle} tuber 
 * @param {TuberExecutionOptions} [inputOptions]
 */
async function executeTuber(request, tuber, inputOptions) {
    inputOptions ??= {};
    const args = inputOptions.args;
    const isTestDrive = inputOptions.isTestDrive ?? false;
    const overwrite = inputOptions.overwrite ?? true;
    const savedData = inputOptions.savedData ?? null;

    if(!tuber.advanced) {
        await request.editReply({
            content: tuber.content,
            files: tuber.files,
        }).catch(console.error);
        return makeNada();
    }

    let result;
    try {
        if(tuber.psVersion !== CURRENT_PS_VERSION)
            throw TuberVersionError(`Este Tubérculo fue creado con la versión **${tuber.psVersion}** de PuréScript, la cual está actualmente reemplazada por la versión **${CURRENT_PS_VERSION}**. Si eres el creador, puedes actualizar el Tubérculo u eliminarlo. Si no, avísale al creador`);

        const tokens = lexer.tokenize(tuber.script);
        logOptions.lexer && console.table(tokens.map(token => ({ ...token, value: (typeof token.value === 'string') ? shortenText(token.value, 32, '[...]') : token.value })));

        const program = parser.parse(tokens);
        logOptions.parser && console.log('Bloque Programa:');
        logOptions.parser && console.dir(program, { depth: null });

        const scope = new Scope(interpreter);
        declareNatives(scope);
        await declareContext(scope, request, savedData);
        result = interpreter.evaluateProgram(program, scope, tuber.script, request, args, isTestDrive);
        if(!result.sendStack.length)
            throw interpreter.TuberSendError('No se envió ningún mensaje');
        logOptions.interpreter && console.log(`Resultado: ${stringifyPSAST(result)}`);
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
        
        const replyContent = {};
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
                replyContent.components = [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tubérculo_getTuberHelp_${tuber.id}_0`)
                        .setLabel('Ver Tubérculo')
                        .setEmoji('🔎')
                        .setStyle(ButtonStyle.Primary),
                )];
        }

        replyContent.embeds = [embed];
        await request.editReply(replyContent);
        throw error;
    }

    let { sendStack, inputStack, saveTable, returned } = result;
    
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
            replyStacks.embeds.push(sendItem.value);
            break;
        default:
            replyStacks.content.push(coerceValue(interpreter, sendItem, 'Text').value);
            break;
        }
    }

    const replyObject = {
        embeds: replyStacks.embeds,
    };

    if(replyStacks.content.length)
        replyObject.content = replyStacks.content.join('\n');
    
    if(overwrite) {
        tuber.inputs = [ inputStack ];
    } else {
        tuber.inputs ??= [];
        /**
         * @param {Array<import('../ps2/interpreter/inputReader').Input>} a
         * @param {Array<import('../ps2/interpreter/inputReader').Input>} b
         */
        const variantEquals = (a, b) => a.every(input1 => b.every(input2 => input1.equals(input2)));
        if(!tuber.inputs.some(otherStack => variantEquals(inputStack, otherStack)))
            tuber.inputs.push(inputStack);
    }

    let mergedSaveData;
    if(typeof tuber.saved === 'object')
        mergedSaveData = new Map(Object.entries(tuber.saved));
    else
        mergedSaveData = new Map();

    for(const [ id, value ] of saveTable)
        if(value.kind === ValueKinds.NADA)
            mergedSaveData.delete(id);
        else
            mergedSaveData.set(id, value);

    const maxKiBytes = 256;
    const savedBytes = sizeof(mergedSaveData);
    if(savedBytes >= maxKiBytes * 1024) {
        return sendDatabaseError(request,
            `Límite de tamaño de guardado excedido. Los datos que se guardan no deben superar los **${maxKiBytes}KiB**\nTu Tubérculo guarda un total de **${savedBytes / 1024}KiB** en datos propios`);
    }

    tuber.saved = mergedSaveData;

    await request.editReply(replyObject).catch(async () => {
        await request.editReply({ content: `⚠️ No se puede enviar el mensaje. Revisa el largo y la validez de los datos` });
        throw Error('Envío inválido');
    });

    return returned;
};

function TuberVersionError(message) {
    const err = new Error(message);
    err.name = 'TuberVersionError';
    return err;
}

/**
 * @param {import('../../commands/Commons/typings.js').ComplexCommandRequest} request
 */
function sendDatabaseError(request, message = '_Este error no tiene descripción_') {
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
        
    return request.editReply({ embeds: [embed] });
}

module.exports = {
    CURRENT_PS_VERSION,
    Token,
    Lexer,
    Parser,
    Interpreter,
    Scope,
    Input,
    lexer,
    parser,
    interpreter,
    declareNatives,
    declareContext,
    executeTuber,
    stringifyPSAST,
    logPSAST,
};
