const { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { shortenText } = require('../../../func');
const DiscordEnvironmentProvider = require('./discordEnvironmentProvider');
const sizeof = /**@type {import('object-sizeof')['default']}*/(/**@type {unknown}*/(require('object-sizeof')));

const CURRENT_PS_VERSION = 1.11;

const VERSIONS = /**@type {const}*/({
    1.1: require('../v1.1'),
});

function tangibleVersion(version) {
    return /**@type {keyof VERSIONS}*/(Math.floor(version * 10) / 10);
}

const LOG_OPTIONS = {
    lexer: true,
    parser: true,
    interpreter: true,
};

/**
 * Esta Función se ejecuta DESPUÉS de comprobar que ambas variantes tienen el mismo largo
 * Verifica si todas las Entradas de la variante A se corresponden suficientemente con las Entradas de la variante B
 * Si un par de Entradas coinciden en nombre, tipo y opcionalidad pero no en extensividad, se hacen ambas extensivos y se consideran equivalentes
 * @param {Array<import('../v1.1/interpreter/inputReader').Input>} a
 * @param {Array<import('../v1.1/interpreter/inputReader').Input>} b
 */
const variantEquals = (a, b) => a.every((input1, i) => {
    const input2 = b[i];
    if(!input1.equals(input2))
        return false;

    if(input1.spread !== input2.spread) {
        input1.setSpread(true);
        input2.setSpread(true);
    }

    return true;
});

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
 * @property {Map<String, import('../v1.1/interpreter/values').RuntimeValue>} saved
 * @property {Number} psVersion
 */

/**
 * @typedef {BaseTubercle & BasicTubercleData} BasicTubercle
 * @typedef {BaseTubercle & AdvancedTubercleData} AdvancedTubercle
 */

/**@typedef {BasicTubercle | AdvancedTubercle} Tubercle*/

/**
 * @typedef {Object} TuberExecutionOptions
 * @property {Array<String>} [args=null]
 * @property {Boolean} [isTestDrive=false]
 * @property {Boolean} [overwrite]
 * @property {Map<String, import('../v1.1/interpreter/values').RuntimeValue>} [savedData]
 */

/**
 * Evalua el tipo de Tubérculo (básico o avanzado) y lo ejecuta. Si es avanzado, se ejecutará con PuréScript
 * @param {import('../../../commands/Commons/typings.js').ComplexCommandRequest} request
 * @param {Tubercle} tuber 
 * @param {TuberExecutionOptions} [inputOptions]
 */
async function executeTuber(request, tuber, inputOptions = {}) {
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
        return VERSIONS[tangibleVersion(CURRENT_PS_VERSION)].makeNada();
    }

    const version = VERSIONS[tangibleVersion(tuber.psVersion)];
    const {
        PS_VERSION,
        lexer,
        parser,
        interpreter,
        Scope,
        Input,
        declareNatives,
        declareContext,
        coerceValue,
        ValueKinds,
        stringifyPSAST,
    } = version ?? VERSIONS[tangibleVersion(CURRENT_PS_VERSION)];

    let result;
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

    let { sendStack, inputStack: inputVariant, saveTable, returned } = result;
    
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
        embeds: replyStacks.embeds,
    };

    if(replyStacks.content.length)
        replyObject.content = replyStacks.content.join('\n');
    
    if(overwrite) {
        tuber.inputs = [ inputVariant ];
    } else {
        tuber.inputs ??= [];
        tuber.inputs = tuber.inputs.map(variant => variant.map(i => Input.from(i)));

        const isNewVariant = () => {
            if(tuber.inputs.length === 0)
                return true;

            if(inputVariant.length === 0)
                return !tuber.inputs.some(otherVariant => otherVariant.length === 0);
            
            return !tuber.inputs.some(otherVariant => inputVariant.length === otherVariant.length && variantEquals(inputVariant, otherVariant));
        };

        if(isNewVariant()) {
            inputVariant.forEach(input1 => tuber.inputs.some(variant => variant.some(input2 => {
                if(input1.name !== input2.name)
                    return false;

                input1.setDesc(input2.desc);
                return true;
            })));

            tuber.inputs.push(inputVariant);
            tuber.inputs.sort((a, b) => a.length - b.length);
        }
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
};

/**
 * 
 * @param {import('../v1.1/embedData').EmbedData} embedData 
 * @returns {EmbedBuilder}
 */
function convertToDiscordEmbed(embedData) {
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

/**@param {*} message*/
function TuberVersionError(message) {
    const err = new Error(message);
    err.name = 'TuberVersionError';
    return err;
}

/**
 * @param {import('../../../commands/Commons/typings.js').ComplexCommandRequest} request
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
    executeTuber,
	CURRENT_PS_VERSION,
    VERSIONS,
    tangibleVersion,
};
