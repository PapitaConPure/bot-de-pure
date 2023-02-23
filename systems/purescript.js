const GuildConfig = require('../localdata/models/guildconfigs.js');
const { p_pure } = require('../localdata/customization/prefixes.js');
const { randRange, fetchUserID, shortenText } = require('../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, MessageAttachment, ThreadChannel } = require('discord.js');
const { TuberLexer } = require('./ps/pslexer.js');
const { TuberParser } = require('./ps/psparser.js');
const { TuberInterpreter } = require('./ps/psinterpreter.js');
const { declareNatives, declareContext } = require('./ps/psnatives.js');
const { TuberScope } = require('./ps/psscope.js');
const { fileRegex, makeValue } = require('./ps/commons.js');

function tuberExecute(input) {
    const lexer = new TuberLexer();
    const tokens = lexer.tokenize(input);
    const parser = new TuberParser(tokens);
    const program = parser.parse();
    const interpreter = new TuberInterpreter(program);

    return interpreter.evaluateProgram();
}

//#region Esqueleto de PuréScript
/**Evalua el tipo de Tubérculo (básico o avanzado) y lo ejecuta. Si es avanzado, se ejecutará con PuréScript
 * @typedef {{author: String, content?: String | null, files?: Array<String>, script?: Array<TuberExpression>, inputs?: Array<{identifier: String, required: Boolean, desc: String}>}} Tubercle
 * @function
 * @param {import("../commands/Commons/typings").CommandRequest} request
 * @param {Tubercle} tuber 
 * @param {{ args: Array<String>, isSlash: Boolean }} inputOptions
 */
const executeTuber = async (request, tuber, { tuberArgs }) => {
    if(!tuber.script)
        return request.reply({
            content: tuber.content,
            files: tuber.files,
        }).catch(console.error);

    let result;
    try {
        const lexer = new TuberLexer();
        const tokens = lexer.tokenize(tuber.script);
        console.table(tokens.map(token => ({ ...token, value: (typeof token.value === 'string') ? shortenText(token.value, 32, '[...]') : token.value })));

        const parser = new TuberParser(tokens);
        const program = parser.parse();
        console.log('Bloque Programa:');
        console.dir(program, { depth: null });

        const scope = new TuberScope();
        declareNatives(scope);
        await declareContext(scope, request, tuber, tuberArgs);

        const interpreter = new TuberInterpreter();
        result = interpreter.evaluateProgram(program, scope, request, tuberArgs == undefined);
        if(!result.sendStack.length) {
            const error = Error('No se envió ningún mensaje');
            error.name = 'TuberSendError';
            throw error;
        }
        console.log('Resultado:');
        console.dir(result, { depth: null });
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

        const embed = new MessageEmbed()
            .setTitle(`⚠ ${error.name}`)
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
        } else 
            embed.setColor('RED')

        await request.reply({ embeds: [embed] });
        throw Error('Ocurrió un error en la ejecución del Tubérculo');
    }

    let { sendStack, inputStack } = result;
    
    if(!sendStack.length) {
        await request.reply({ content: `⚠ Se esperaba un envío de mensaje` });
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
        replyObject.content = replyObject.content.join('\n');
    else
        delete replyObject.content;

    // console.log(replyObject);

    tuber.inputs = inputStack;

    return request.reply(replyObject).catch(async () => {
        await request.reply({ content: `⚠ No se puede enviar el mensaje. Revisa el largo y la validez de los datos` });
        throw Error('Envío inválido');
    });
};

module.exports = {
    TuberLexer,
    TuberParser,
    TuberInterpreter,
    tuberExecute,
    executeTuber,
};