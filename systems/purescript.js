const GuildConfig = require('../localdata/models/guildconfigs.js');
const { p_pure } = require('../localdata/customization/prefixes.js');
const { randRange, fetchUserID } = require('../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, MessageAttachment } = require('discord.js');

//RegExp para analizar enlaces de archivos válidos
const fileRegex = /(http:\/\/|https:\/\/)?(www\.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(txt|png|jpg|jpeg|webp|gif|webm|mp4|mp3|wav|flac|ogg)[a-zA-Z-_\.0-9#:?=&;,]*/;
//Particiones de memoria consideradas como "solo lectura"
const readOnlyMem = [
    '__functions__',
    '__tuber__',
    '__replyContent__',
    'archivos',
    'usuario',
    'entradas',
    'funciones',
    'VERDADERO',
    'FALSO',
];

/**Definir tipos para IntelliSense
 * @typedef {Array<String>} TuberExpression
 * @typedef {{author: String, content?: String | null, files?: Array<String>, script?: Array<TuberExpression>, inputs?: Array<{identifier: String, required: Boolean, desc: String}>}} Tubercle
 * @typedef {{__functions__: {}, __tuber__: Tubercle, __replyContent__: {}, archivos: Array<String>, usuario: MemberProps, entradas: {}, funciones: {}, VERDADERO: true, FALSO: false}} TuberMemory
 * @typedef {{nombre: String, apodo: String, etiqueta: String, avatar: String}} MemberProps
 */

//#region Esqueleto de PuréScript
/**Evalua el tipo de Tubérculo (básico o avanzado) y lo ejecuta. Si es avanzado, se ejecutará con PuréScript
 * @function
 * @param {import("../commands/Commons/typings").CommandRequest} request
 * @param {Tubercle} tuber 
 * @param {{ args: Array<String>, isSlash: Boolean }} inputOptions
 */
const executeTuber = async (request, tuber, { args, isSlash }) => {
	if(tuber.script) { //Tubérculo avanzado (PuréScript)
		//Errores PS
		let errors = 0;
		const psError = (description, line, operation) => {
			errors++;
			return request.reply({ content: `<⚠️ Error PS: \`${description} (Expresión ${line + 1}, Operación ${operation.toUpperCase()})\`>` });
		};

		//#region Memoria del script
        /**@type {TuberMemory}*/
		let mem = {
			__functions__: {
				//Aleatoreidad
				/**@param {[Number, Number]} param0*/
				['dado']: ([min, max]) => randRange(min ?? 1, max ?? 7, true),
				/**@param {[Number, Number]} param0*/
				['dadoDecimal']: ([min, max]) => randRange(min ?? 0, max ?? 1, false),
				//Funcionalidad
				/**@param {[*]} param0*/
				['largo']: ([obj]) => obj.length ?? obj.size,
				/**@param {[String]} param0*/
				['minus']: ([text]) => text.toLowerCase(),
				/**@param {[String]} param0*/
				['mayus']: ([text]) => text.toUpperCase(),
				//Embeds
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoEstablecerAutor']: ([embed, author, iconUrl]) => embed.setAuthor({ name: author, iconURL: iconUrl }),
				/**@param {[MessageEmbed, String]} param0*/
				['marcoEstablecerEncabezado']: ([embed, title]) => embed.setTitle(title),
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoEstablecerPie']: ([embed, footer]) => embed.setFooter({ text: footer }),
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoEstablecerMiniatura']: ([embed, image]) => embed.setThumbnail(image),
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoEstablecerColor']: ([embed, color]) => embed.setColor(color),
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoEstablecerImagen']: ([embed, image]) => embed.setImage(image),
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoAgregarCampo']: ([embed, title, content, inline]) => embed.addField(title, content.slice(0, 1023), inline),
			},
            __tuber__: tuber,
            __replyContent__: {},
			archivos: isSlash ? [] : request.attachments.map(attachment => attachment.proxyURL),
			usuario: getMemberProps(request.member),
			entradas: {},
			funciones: {},
			VERDADERO: true,
			FALSO: false,
		};
		//Establecer claves iniciales como solo-lectura
		const readOnlyMem = Object.keys(mem);
		// console.log('readOnlyMem:', readOnlyMem);
		//#endregion

		//#region Entradas personalizadas
		if(tuber.inputs && args !== undefined && args !== null) {
			const argsList = (isSlash
				? options.fetchParamPoly(args, 'entradas', args.getString, null).filter(input => input)
				: args);
			const attachmentsList = [
				...request.attachments.map(attachment => attachment.proxyURL),
				...argsList.map(arg => arg.match(fileRegex) ? arg : undefined).filter(arg => arg),
			];
			const contentsList = argsList.filter(arg => arg);
			console.log('---------------------------------\ncontentsList:', contentsList, '\nattachmentsList:', attachmentsList, '\n- - - - - - -       - - - - - - -');
			
			const readyInputs = tuber.inputs.map((input, i) => {
				console.log(input, i);
				const arg = input.isAttachment ? attachmentsList.shift() : contentsList.shift();
				if(!arg && input.required) {
					psError(`se requiere que ingreses "${input.identifier}" (entrada Nº ${i + 1}) para ejecutar este Tubérculo`, -2, 'INICIALIZAR');
					return false;
				}
				
				mem.entradas[input.identifier] = arg;
				return true;
			});
			// console.log('entradas:', mem.entradas, '\nreadyInputs:', readyInputs, '\n---------------------------------');
			if(!readyInputs.every(input => input)) return await request.reply(`🛑 Este Tubérculo requiere más parámetros.\nUsa \`${p_pure(request.guildId).raw}tubérculo --ayuda <TuberID>\` para más información`);
		}
		//#endregion
		
		//Ejecutar secuencia de expresiones
		await readExpressions(tuber.script, mem, { memLogEnabled: false });
        const { __replyContent__: replyContent } = mem;

        //Recopilación final
		// console.log('Memoria final:', mem, '\nErrores:', errors, '\nContenido de respuesta:', replyContent);
		if(!Object.keys(replyContent)?.length)
			await psError('debes enviar al menos un texto u archivo', -2, 'RECOPILAR');

        //Testificar ejecución
		if(errors) {
			await request.reply({ content: `⚠️ Se han encontrado **${errors} Errores PS** en la ejecución de PuréScript` });
			return new Error('Error de PuréScript');
		} else
			return await request.reply(replyContent).catch(console.error);
	} else //Tubérculo básico (contenido y archivos directos)
		return await request.reply({
			content: tuber.content,
			files: tuber.files,
		}).catch(console.error);
};

/**Toma un arreglo de arreglos de palabras (arreglo de "expresiones") y las ejecuta secuencialmente
 * @function
 * @param {Array<TuberExpression>} expressions 
 * @param {TuberMemory} mem 
 * @param {{memLogEnabled: Boolean}} expressionOptions
 * @returns {Object} Respuesta para mensaje
 */
const readExpressions = async (expressions, mem, { memLogEnabled }) => {
    await Promise.all(expressions.map((expression, l) => {
        const expr = [ ...expression ];
        if(memLogEnabled) console.log(`Expresión ${l}:`, getLineString(expr), '\tCon mem:', mem);
        else console.log(`Expresión ${l}:`, getLineString(expr));
        const { __tuber__: tuber } = mem;

        //Realizar acciones en base a palabra clave "operación"
        const operation = expr.shift().toLowerCase();
        switch(operation) {
            //#region Manejo de datos
            //Registrar entradas o entidades externas importadas
            case 'registrar': {
                console.log('Operación REGISTRAR');
                if(!expr.length) return psError('se esperaba contexto', l, operation);
                const target = expr.shift().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
                if(!expr.length) return psError('se esperaba un identificador', l, operation);
                const getIdentifierAndValue = () => {
                    const identifier = expr.shift();
                    if(expr.shift().toLowerCase() !== 'con') return psError('se esperaba "CON" en asignación de carga', l, operation);
                    if(!expr.length) return psError('se esperaba una asignación', l, operation);
                    const value = expr.shift();
                    return [ identifier, value ];
                }

                switch(target) {
                    case 'entrada':
                        console.log('Registrando entrada');
                        const optional = (expr[0]?.toLowerCase() === 'opcional');
                        if(optional) expr.shift();
                        const [ identifier, loadValue ] = getIdentifierAndValue();
                        const processedValue = readReference(mem, [loadValue]);
                        tuber.inputs = tuber.inputs ?? [];
                        tuber.inputs.push({
                            identifier: identifier,
                            required: !optional,
                            desc: '',
                            isAttachment: loadValue.startsWith('$archivos') || loadValue.match(fileRegex),
                        });
                        mem.entradas[identifier] = processedValue;
                        console.log(`Se registró una entrada "${identifier}" con valor de prueba`, loadValue , '->', processedValue);
                        tuber.script[l] = [''];
                        break;

                    case 'funcion':
                        return psError('el contexto REGISTRAR/FUNCIÓN todavía no está disponible', l, operation);

                    case 'lista':
                        return psError('el contexto REGISTRAR/LISTA todavía no está disponible', l, operation);

                    case 'conjunto':
                        return psError('el contexto REGISTRAR/CONJUNTO todavía no está disponible', l, operation);

                    case 'texto':
                        return psError('el contexto REGISTRAR/TEXTO todavía no está disponible', l, operation);

                    default:
                        return psError('contexto inválido', l, operation);
                }
                if(memLogEnabled) console.log(mem);
                break;
            }
            
            //Crear entidades de datos
            case 'crear': {
                console.log('Operación CREAR');
                if(!expr.length) return psError('se esperaba contexto', l, operation);
                const target = expr.shift().toLowerCase();
                if(!expr.length) return psError('se esperaba un identificador', l, operation);
                const identifier = expr.shift();

                switch(target) {
                    case 'lista':
                        mem[identifier] = [];
                        break;

                    case 'conjunto':
                        mem[identifier] = {};
                        break;

                    case 'texto':
                        mem[identifier] = '';
                        break;

                    case 'marco':
                        mem[identifier] = new MessageEmbed();
                        break;

                    default:
                        return psError('contexto inválido', l, operation);
                }
                if(memLogEnabled) console.log(mem);
                break;
            }

            //Guardar en base de datos
            case 'guardar': {
                console.log('Operación GUARDAR');
                return psError('la palabra clave GUARDAR todavía no está disponible', l, operation);
            }

            //Cargar valores en entidades existentes, o crearlas si no existen
            case 'cargar': {
                console.log('Operación CARGAR');
                if(!expr.length) return psError('se esperaba un identificador', l, operation);
                const identifier = expr.shift();
                if(expr.shift().toLowerCase() !== 'con') return psError('se esperaba "CON" en asignación de carga', l, operation);
                if(!expr.length) return psError('se esperaba una asignación', l, operation);
                const loader = expr.shift();
                let loadValue;
                try {
                    switch(loader.toLocaleLowerCase()) {
                        case 'lista':
                            if(!expr.length) return psError('se esperaba un valor', l, operation);
                            loadValue = readLineReferences(mem, expr);
                            break;
                        case 'texto':
                            if(!expr.length) return psError('se esperaba texto', l, operation);
                            loadValue = readLineReferences(mem, expr).join(' ');
                            break;
                        default:
                            loadValue = readReference(mem, [loader]);
                            break;
                    }
                } catch(err) {
                    console.error(err);
                    return psError('referencia inválida', l, operation, true);
                }
                //if(!expr.length) return psError('se esperaba un valor', l, operation);
                if(identifier.startsWith('$')) {
                    console.log('Carga referencial');
                    let memtemp = loadValue;
                    const sequence = identifier.slice(1).split('->');
                    if(!sequence.length) return psError('se esperaba un identificador', l, operation);
                    if(readOnlyMem.includes(sequence[0])) return psError(`se intentó modificar el valor de solo lectura "$${sequence[0]}"`, l, operation);

                    //Leer
                    let memRead = mem;
                    sequence.slice(0, -1).forEach(sq => {
                        memRead = mem[sq];
                        if(memLogEnabled) console.log(memRead);
                    });
                    memRead = memRead ?? {};

                    //Escribir
                    sequence.slice(0).reverse().forEach(sq => {
                        memtemp = { ...memRead, [`${sq}`]: memtemp };
                        if(memLogEnabled) console.log(memtemp);
                    });

                    console.log('wasd', sequence[0], 'fg', mem[sequence[0]]);
                    
                    mem = { ...mem, ...memtemp };
                } else {
                    console.log('Carga directa');
                    if(readOnlyMem.includes(identifier)) return psError(`se intentó modificar el valor de solo lectura "${identifier}"`, l, operation);
                    mem[identifier] = loadValue;
                }
                
                console.log('Carga terminada con \n\tidentifier', identifier, '\n\tloader:', loader, '\n\tloadValue:', loadValue);
                break;
            }

            //Evolucionar listas
            case 'extender': {
                console.log('Operación EXTENDER');
                if(!expr.length) return psError('se esperaba un identificador', l, operation);
                const identifier = expr.shift();
                if(expr.shift().toLowerCase() !== 'con') return psError('se esperaba "CON" en extensión', l, operation);
                if(!expr.length) return psError('se esperaba una asignación', l, operation);
                const loader = expr.shift().toLocaleLowerCase();
                let loadValue;
                try {
                    switch(loader) {
                        case 'lista':
                            if(!expr.length) return psError('se esperaba un valor', l, operation);
                            loadValue = readLineReferences(mem, expr);
                            break;
                        case 'texto':
                            if(!expr.length) return psError('se esperaba texto', l, operation);
                            loadValue = readLineReferences(mem, expr).join(' ');
                            break;
                        default:
                            loadValue = readReference(mem, [loader]);
                            break;
                    }
                } catch(err) {
                    console.error(err);
                    return psError('referencia inválida', l, operation, true);
                }
                let memRead = mem;

                if(identifier.startsWith('$')) {
                    console.log('Carga referencial');
                    const sequence = identifier.slice(1).split('->');
                    if(!sequence.length) return psError('se esperaba un identificador', l, operation);

                    //Leer
                    sequence.forEach(sq => {
                        memRead = mem[sq];
                        if(memLogEnabled) console.log(memRead);
                    });
                } else {
                    console.log('Carga directa');
                    memRead = mem[identifier];
                }
                //Escribir
                if(memRead === undefined || memRead === null)
                    return psError(`el identificador "${identifier}" no existe`, l, operation);
                if(!Array.isArray(memRead))
                    return psError(`el identificador ${identifier} no corresponde a una lista`, l, operation);

                memRead.push(loadValue);
                console.log('Carga terminada con \n\tidentifier', identifier, '\n\tloader:', loader, '\n\tloadValue:', loadValue);
                break;
            }

            //Ejecutar funciones sin almacenar el valor de retorno; para cargas indirectas
            case 'ejecutar': {
                console.log('Operación EJECUTAR');
                if(!expr.length) return psError('se esperaba un valor o función', l, operation);
                readLineReferences(mem, expr);
                break;
            }
            //#endregion

            //#region Condicionales
            case 'si': {
                console.log('Operación SI');
                const logicComponents = expr.join(' ').split(/ [Yy] /).map(e => e.split(' '));
                console.log(logicComponents);
                const logicIsTruthy = (lc) => {
                    let approved = false;
                    console.log('Verificando lógica "Y":', lc);
                    if(!lc.length) return psError('se esperaba un identificador', l, operation);
                    const identifier = lc.shift();
                    if(!lc.length) return psError('se esperaba contexto', l, operation);
                    const target = lc.shift();
                    if(!target)
                        approved = identifier;
                    else
                        switch(target.toLowerCase()) {
                            case 'es': {
                                if(!lc.length) return psError('se esperaba un segundo identificador', l, operation);
                                const identifier2 = lc.shift();
                                console.log(identifier, '==', identifier2);
                                if(identifier == identifier2)
                                    approved = true;
                                break;
                            }

                            case 'existe': {
                                if(identifier !== undefined && identifier !== null)
                                    approved = true;
                                break;
                            }
                        }
                    
                    console.log('Lógica "Y" determinada:', approved);
                    return approved;
                }

                const processedLogic = logicComponents.map(logicIsTruthy);
                console.log('Malla lógica:', processedLogic, '\nDeterminado en SI:', processedLogic.every(l => l === true));

                break;
            }

            case 'sino': {
                console.log('Operación SINO');
                return psError('la palabra clave SINO todavía no está disponible', l, operation);
            }

            case 'finsi': {
                console.log('Operación FINSI');
                return psError('la palabra clave FINSI todavía no está disponible', l, operation);
            }
            //#endregion

            //#region Respuestas del Tubérculo
            //Enviar mensaje de Discord
            case 'enviar': {
                console.log('Operación ENVIAR');
                const message = {};
                if(!expr.length) return psError('no se puede enviar un mensaje vacío', l, operation);
                const target = expr.shift().toLowerCase();
                const values = (target === 'marcos')
                    ? expr.map(e => e.startsWith('$') ? getAttribute(mem, [e]) : e)
                    : readLineReferences(mem, expr).filter(refVal => refVal !== undefined && refVal !== null);
                if(!values.length) return psError('los valores especificados no existen', l, operation);
                console.log('Valores obtenidos para enviar: ', values);
                
                switch(target) {
                    case 'archivos':
                        message.files = values;
                        console.log('message.files:', message.files);
                        break;

                    case 'marcos':
                        message.embeds = values;
                        console.log('message.embeds:', message.embeds);
                        break;

                    case 'texto':
                        message.content = values.join(' ');
                        console.log('message.content:', message.content);
                        break

                    default:
                        return psError('se esperaba contenido de mensaje', l, operation);
                }
                mem.__replyContent__ = { ...mem.__replyContent__, ...message };
                console.log('replyContent:', mem.__replyContent__);
                break;
            }
            //#endregion

            //#region Asistencia de programación
            case 'comentar': {
                console.log('Operación COMENTAR');
                break;
            }

            case 'comprobar': {
                tuber.script[l] = [''];
                const identifier = expr.shift();
                const value = readReference(mem, [identifier]);
                let display;
                switch(typeof value) {
                    case 'boolean': display = `\`$${value ? 'VERDADERO' : 'FALSO'}\``; break;
                    case 'function': display = '`(FUNCIÓN)`'; break;
                    case 'number': display = `\`${value}\``; break;
                    case 'string': display = `\`"${value}"\``; break;
                    case 'undefined': display = '`(NO DEFINIDO)`'; break;
                    case 'object':
                        if(Array.isArray(value))
                            display = `\`(LISTA)\`:\n${value.map((elem, i) => `\t\t\`->${i}: ${elem}\``).join('\n')}\n`;
                        else if(value)
                            display = `\`(CONJUNTO)\`:\n${Object.entries(value).map(([k,v]) => `\t\t\`->${k}: ${v}\``).join('\n')}\n`;
                        else
                            display = '`(NULO)`';
                        break;
                }
                return request.channel.send({ content: `<🔎 Comprobando valor para identificador: \`${identifier}\` = ${display} \`(Expresión ${l + 1})\`>` });
            }
            //#endregion

            //Operación nula (no hacer nada y olvidar)
            default: {
                console.log('Operación *');
                tuber.script[l] = [''];
                break;
            }
        }
        console.log('Retornando...');
        return;
    }));
};
//#endregion

//#region Funciones internas
/**Obtiene las propiedades básicas del miembro especificado
 * @param {import('discord.js').GuildMember} m Miembro a procesar
 * @returns {MemberProps} Propiedades extraídas del miembro ingresado
 */
const getMemberProps = (m) => ({
    nombre: m.user.username,
    apodo: m.nickname ?? m.user.username,
    etiqueta: m.user.tag,
    avatar: m.user.avatarURL({ dynamic: true }),
});

/**Devuelve un string con los componentes de la expresión, sin procesar por referencias
 * @function
 * @param {TuberExpression} expression La expresión
 * @returns {String} El string conteniendo los componentes de la expresión unidos por un espacio
 */
const getLineString = (expression) => expression.join(' ');

/**Leer valor o referencia y devolver el objeto referenciado, o el valor directo en forma de string
 * @function
 * @param {TuberMemory} mem La memoria con la cuál trabajar
 * @param {Array<String>} sequence La secuencia de referencias a procesar
 * @returns {*} La referencia o valor procesado
 */
const getAttribute = (mem, sequence) => {
    const firstSequenced = sequence.shift().slice(1);
    if(!sequence.length && firstSequenced.endsWith('/'))
        return callMemFunction(mem, firstSequenced);
        
    let att = mem[firstSequenced];
    console.log('getAttribute:', sequence, '| att:', att);
    sequence.forEach(a => {
        console.log('Antes de comprobar índice:', a);
        if(a.startsWith('$')) a = getAttribute(mem, [a]);
        console.log('Luego de comprobar índice:', a, '|', att[a]);
        if(att[a].startsWith('$')) {
            console.log('Referencia compleja detectada');
            if(att[a].endsWith('/'))
                att = callMemFunction(mem, att[0]);
            else
                att = getAttribute(mem, sequence);
        } else {
            console.log('Referencia simple detectada');
            att = att[a];
        }
    });
    console.log('att final:', att);
    return att;
};

/**Buscar función en memoria y llamarla. Se devuelve el valor de retorno de la función averiguada
 * @function
 * @param {String} functionCall La notación de función en forma de string (PuréScript)
 * @returns {*} El valor devuelto por la función ejecutada
 */
const callMemFunction = (mem, functionCall) => {
    const functionFactors = functionCall.split('/').filter(ff => ff);
    const fn = functionFactors.shift();
    console.log('Componiendo función');
    const functionParams = functionFactors.map(ff => ff.startsWith('$') ? getAttribute(mem, [ff]) : ff);
    console.log('Factores de la función', fn, '::', functionParams);
    if(mem.__functions__[fn])
        return (mem.__functions__[fn])(functionParams);
    else if(mem.funciones[fn]) {
        return '42';
    } else {
        psError(`la función "${fn ?? ''}" no existe`, -2, 'ANÓNIMA');
        return undefined;
    }
};

/**Leer valor o referencia y devolver un string con lo procesado
 * @param {String} str
 * @returns {String}
 */
const readReference = (mem, str) => {
    const rawReference = Array.isArray(str) ? str[0] : str;
    let reference;
    console.log('Referencia cruda:', rawReference);
    if(rawReference.startsWith('$')) {
        const sequence = rawReference.split('->');
        console.log('Secuencia:', sequence.length, 'pasos');
        reference = getAttribute(mem, sequence);
    } else
        reference = getLineString(str);
    console.log('Referencia procesada:', reference);
    return reference;
};

/**Leer múltiples valores o referencias y combinarlas en un string
 * @function
 * @param {TuberMemory} mem
 * @param {TuberExpression} expr
 * @returns {String}
 */
const readLineReferences = (mem, expr) => {
    console.log('Referencias crudas:', expr);
    const references = expr.map(w => {
        if(w.match(/^[\n*~`]*\$/)) {
            const sequences = w.split(/[\n*~`]+/).map(sequence => sequence.split('->'));
            return sequences.map(sequence => sequence[0].startsWith('$') ? getAttribute(mem, sequence) : sequence[0]).join('\n');
        } else
            return w;
    });
    console.log('Referencias procesadas:', references);
    return references;
}
//#endregion

module.exports = {
    executeTuber,
    readExpressions,
};