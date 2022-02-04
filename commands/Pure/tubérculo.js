const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');
const { p_pure } = require('../../localdata/prefixget.js');
const { fetchFlag, isNotModerator, randRange, fetchUserID } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, MessageCollector } = require('discord.js');

const options = new CommandOptionsManager()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar')
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',     { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje', { poly: 'MULTIPLE', optional: true })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag('v', 		'ver', 		  				  'para ver detalles de un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo')
	.addFlag('s', 		['script','puré','pure'], 	  'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`');

//PuréScript
/**
 * @param {import("../Commons/typings").CommandRequest} request
 * @param {{author: String, content?: String | null, files?: Array<String>, script?: Array<Array<String>>, inputs?: Array<{identifier: String, required: Boolean, desc: String}>}} tuber 
 */
const executeTuber = async(request, tuber, { args, isSlash }) => {
	if(tuber.script) {
		//Contenido de respuesta del Tubérculo
		let replyContent = {};

		//Errores PS
		let errors = 0;
		const psError = (description, line, operation) => {
			errors++;
			return request.reply({ content: `<⚠️ Error PS: \`${description} (Expresión ${line + 1}, Operación ${operation.toUpperCase()})\`>` });
		};

		//#region Memoria del script
		/**@param {import('discord.js').GuildMember} m*/
		const getMemberProps = (m) => ({
			nombre: m.user.username,
			apodo: m.nickname ?? m.user.username,
			etiqueta: m.user.tag,
			avatar: m.user.avatarURL({ dynamic: true }),
		});

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
				['marcoAgregarAutor']: ([embed, author, iconUrl]) => embed.setAuthor(author, iconUrl),
				/**@param {[MessageEmbed, String]} param0*/
				['marcoAgregarEncabezado']: ([embed, title]) => embed.setAuthor(title),
				/**@param {[MessageEmbed, String, String]} param0*/
				['marcoAgregarCampo']: ([embed, title, content, inline]) => embed.addField(title, content, inline),
			},
			archivos: isSlash ? [] : request.attachments.map(attachment => attachment.proxyURL),
			usuario: getMemberProps(request.member),
			entradas: {},
			funciones: {},
			VERDADERO: true,
			FALSO: false,
		};
		//Establecer claves iniciales como solo-lectura
		const readOnlyMem = Object.keys(mem);
		console.log('readOnlyMem:', readOnlyMem);
		//#endregion

		//#region Entradas personalizadas
		const fileRegex = /(http:\/\/|https:\/\/)?(www\.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}\/[a-zA-Z-_\/\.0-9#:?=&;,]*\.(txt|png|jpg|jpeg|webp|gif|webm|mp4|mp3|wav|flac|ogg)[a-zA-Z-_\.0-9#:?=&;,]*/;
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
			console.log('entradas:', mem.entradas, '\nreadyInputs:', readyInputs, '\n---------------------------------');
			if(!readyInputs.every(input => input)) return await request.reply(`🛑 Este Tubérculo requiere más parámetros.\nUsa \`${p_pure(request.guildId).raw}tubérculo --ayuda <TuberID>\` para más información`);
		}
		//#endregion
		
		//#region Funciones internas
		const getLineString = (expression) => expression.join(' ');//.split(/[\n ]*#FIN#[\n ]*/).join('\n');
		const getAttribute = (sequence) => {
			const firstSequenced = sequence.shift().slice(1);
			if(!sequence.length && firstSequenced.endsWith('/'))
				return callMemFunction(firstSequenced);
				
			let att = mem[firstSequenced];
			console.log('getAttribute:', sequence, '| att:', att);
			sequence.forEach(a => {
				console.log('Antes de comprobar índice:', a);
				if(a.startsWith('$')) a = getAttribute([a]);
				console.log('Luego de comprobar índice:', a, '|', att[a]);
				if(att[a].startsWith('$')) {
					console.log('Referencia compleja detectada');
					if(att[a].endsWith('/'))
						att = callMemFunction(att[0]);
					else
						att = getAttribute(sequence);
				} else {
					console.log('Referencia simple detectada');
					att = att[a];
				}
			});
			console.log('att final:', att);
			return att;
		}
		const callMemFunction = (functionCall) => {
			const functionFactors = functionCall.split('/').filter(ff => ff);
			const fn = functionFactors.shift();
			console.log('Componiendo función');
			const functionParams = functionFactors.map(ff => ff.startsWith('$') ? getAttribute([ff]) : ff);
			console.log('Factores de la función', fn, '::', functionParams);
			if(mem.__functions__[fn])
				return (mem.__functions__[fn])(functionParams);
			else if(mem.funciones[fn]) {
				return '42';
			} else {
				psError(`la función "${fn ?? ''}" no existe`, -2, 'ANÓNIMA');
				return undefined;
			}
		}
		//Leer valores o punteros
		const readReference = (str) => {
			const rawReference = Array.isArray(str) ? str[0] : str;
			let reference;
			console.log('Referencia cruda:', rawReference);
			if(rawReference.startsWith('$')) {
				const sequence = rawReference.split('->');
				console.log('Secuencia:', sequence.length, 'pasos');
				reference = getAttribute(sequence);
			} else
				reference = getLineString(str);
			console.log('Referencia procesada:', reference);
			return reference;
		}
		
		const readLineReferences = (expr) => {
			console.log('Referencias crudas:', expr);
			const references = expr.map(w => {
				if(w.match(/^[\n*~`]*\$/)) {
					const sequences = w.split(/[\n*~`]+/).map(sequence => sequence.split('->'));
					return sequences.map(sequence => sequence[0].startsWith('$') ? getAttribute(sequence) : sequence[0]).join('\n');
				} else
					return w;
			});
			console.log('Referencias procesadas:', references);
			return references;
		}
		//#endregion

		//Ejecutar secuencia de expresiones
		await Promise.all(tuber.script.map((expression, l) => {
			const expr = [ ...expression ];
			console.log(`Expresión ${l}:`, expr.join(' '), '\tCon mem:', mem);
			let working = Promise.resolve(); //Promesa para cuando se estén realizando trabajos de fondo
			const operation = expr.shift().toLowerCase();
			switch(operation) {
				case 'registrar': {
					console.log('Operación REGISTRAR');
					if(!expr.length) return psError('se esperaba contexto', l, operation);
					const target = expr.shift().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
					if(!expr.length) return psError('se esperaba un identificador', l, operation);
					const identifier = expr.shift();
					if(expr.shift().toLowerCase() !== 'con') return psError('se esperaba "CON" en asignación de carga', l, operation);
					if(!expr.length) return psError('se esperaba una asignación', l, operation);
					const loadValue = expr.shift();

					switch(target) {
						case 'entrada':
							console.log('Registrando entrada');
							tuber.inputs = tuber.inputs ?? [];
							const processedValue = readReference([loadValue]);
							tuber.inputs.push({
								identifier: identifier,
								required: true,
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
					console.log(mem);
					break;
				}
				
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
					console.log(mem);
					break;
				}

				case 'guardar': {
					console.log('Operación GUARDAR');
					return psError('la palabra clave GUARDAR todavía no está disponible', l, operation);
				}

				case 'cargar': {
					console.log('Operación CARGAR');
					if(!expr.length) return psError('se esperaba un identificador', l, operation);
					const identifier = expr.shift();
					if(expr.shift().toLowerCase() !== 'con') return psError('se esperaba "CON" en asignación de carga', l, operation);
					if(!expr.length) return psError('se esperaba una asignación', l, operation);
					const loader = expr.shift().toLocaleLowerCase();
					let loadValue;
					try {
						switch(loader) {
							case 'lista':
								if(!expr.length) return psError('se esperaba un valor', l, operation);
								loadValue = readLineReferences(expr);
								break;
							case 'texto':
								if(!expr.length) return psError('se esperaba texto', l, operation);
								loadValue = readLineReferences(expr).join(' ');
								break;
							default:
								loadValue = readReference([loader]);
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
							console.log(memRead);
						});
						memRead = memRead ?? {};

						//Escribir
						sequence.slice(0).reverse().forEach(sq => {
							memtemp = { ...memRead, [`${sq}`]: memtemp };
							console.log(memtemp);
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
								loadValue = readLineReferences(expr);
								break;
							case 'texto':
								if(!expr.length) return psError('se esperaba texto', l, operation);
								loadValue = readLineReferences(expr).join(' ');
								break;
							default:
								loadValue = readReference([loader]);
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
							console.log(memRead);
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

				case 'ejecutar': {
					console.log('Operación EJECUTAR');
					if(!expr.length) return psError('se esperaba un valor o función', l, operation);
					readLineReferences(expr);
					break;
				}

				case 'enviar': {
					console.log('Operación ENVIAR');
					const message = {};
					if(!expr.length) return psError('no se puede enviar un mensaje vacío', l, operation);
					const target = expr.shift().toLowerCase();
					const values = (target === 'marcos')
						? expr.map(e => e.startsWith('$') ? getAttribute([e]) : e)
						: readLineReferences(expr).filter(refVal => refVal !== undefined && refVal !== null);
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
							break

						default:
							return psError('se esperaba contenido de mensaje', l, operation);
					}
					replyContent = { ...replyContent, ...message };
				}

				default: {
					console.log('Operación *');
					break;
				}
			}
			return working;
		}));
		console.log('Memoria final:', mem, '\nErrores:', errors, '\nContenido de respuesta:', replyContent);
		if(!Object.keys(replyContent).length)
			await psError('debes enviar al menos un texto u archivo', -2, 'RECOPILAR');

		if(errors) {
			await request.reply({ content: `⚠️ Se han encontrado **${errors} Errores PS** en la ejecución de PuréScript` });
			return new Error('Error de PuréScript');
		} else
			return await request.reply(replyContent);
	} else
		return await request.reply({
			content: tuber.content,
			files: tuber.files,
		});
};

const pageMax = 10;
const paginationRows = (page, backward, forward, lastPage) => {
	let i = 0;
	return [
		new MessageActionRow().addComponents(
			new MessageButton()
			.setCustomId('tubérculo_loadPage_0_START')
			.setEmoji('934430008586403900')
			.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${backward}_BACKWARD`)
				.setEmoji('934430008343158844')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${forward}_FORWARD`)
				.setEmoji('934430008250871818')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${lastPage}_END`)
				.setEmoji('934430008619962428')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${page}_RELOAD`)
				.setEmoji('934432754173624373')
				.setStyle('PRIMARY'),
		),
		new MessageActionRow().addComponents(
			new MessageSelectMenu()
				.setCustomId('tubérculo_loadPageExact')
				.setPlaceholder('Seleccionar página')
				.setOptions(Array(Math.min(lastPage + 1, 24)).fill(null).map(() => ({
					value: `${i}`,
					label: `Página ${++i}`,
				}))),
		),
		new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId('tubérculo_filterAuthor')
				.setLabel('Filtrar Autor')
				.setEmoji('936530498061213756')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId('tubérculo_filterTuberID')
				.setLabel('Filtrar TuberID')
				.setEmoji('936530498061213756')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId('tubérculo_filterClear')
				.setLabel('Mostrar todo')
				.setEmoji('936531643496288288')
				.setStyle('DANGER'),
		),
	]
};

module.exports = {
	name: 'tubérculo',
	aliases: [
		'tuberculo',
		'tubercle', 'tuber', 't'
	],
	brief : 'Permite crear, editar, listar, borrar o ejecutar comandos personalizados de servidor',
	desc: [
		'Permite `--crear`, *editar*, *listar*, `--borrar` o __ejecutar__ Tubérculos (comandos personalizados de servidor).',
		'Usar el comando sin más listará todos los Tubérculos de los que dispone el servidor actual',
		'En caso de estar creando un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya está registrada, será *reemplazada (editada)*',
		'En cualquier parte del contenido del mensaje, coloca "#FIN#" para bajar un renglón',
		'En caso de estar editando o borrando un Tubérculo existente, se requerirá su TuberID',
		'⚠️ Ten en cuenta que este comando es experimental y cualquier Tubérculo ingresado podría ser eventualmente perdido a medida que me actualizo',
	].join('\n'),
	flags: [
		'common',
	],
	options,
	callx: '<id?> <mensaje?> <archivos?>',
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Determinar operación
		const helpstr = `Usa \`${p_pure(request.guild).raw}ayuda ${module.exports.name}\` para más información`;
		const operation = (isSlash
			? [
				args.getBoolean('crear' ) ? 'crear'  : undefined,
				args.getBoolean('ver'   ) ? 'ver' 	 : undefined,
				args.getBoolean('borrar') ? 'borrar' : undefined,
			] : [
				fetchFlag(args, { ...options.flags.get('crear').structure,  callback: 'crear'  }),
				fetchFlag(args, { ...options.flags.get('ver').structure,  	callback: 'ver'    }),
				fetchFlag(args, { ...options.flags.get('borrar').structure, callback: 'borrar' }),
			]
		).find(op => op);
		const ps = isSlash ? args.getBoolean('script') : fetchFlag(args, { ...options.flags.get('script').structure, callback: true });

		//Adquirir ID de Tubérculo
		const id = isSlash ? args.getString('id') : args.shift();

		//Preparar ejecución
		const gid = request.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		const members = request.guild.members.cache;

		
		gcfg.tubers = gcfg.tubers || {};

		if(!operation && !id) { //Listar Tubérculos
			const items = Object.entries(gcfg.tubers).reverse();
			const lastPage = Math.ceil(items.length / pageMax) - 1;
			return await request.reply({
				embeds: [
					new MessageEmbed()
						.setColor('LUMINOUS_VIVID_PINK')
						.setAuthor(request.guild.name, request.guild.iconURL())
						.setTitle('Arsenal de Tubérculos del Servidor')
						.addField(
							`🥔)▬▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${items.length ? `1 / ${lastPage + 1}` : '- - -'} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬▬(🥔`, 
							items.length
								? items.splice(0, pageMax)
									.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? request.guild.me).user.username}`)
									.join('\n')
								: `Este servidor no tiene ningún Tubérculo.\nComienza a desplegar TuberIDs con \`${p_pure(request.guildId)}tubérculo --crear\``,
							true,
						),
				],
				components: (items.length < pageMax) ? null : paginationRows(0, lastPage, 1, lastPage),
			});
		} else { //Realizar operación sobre ID de Tubérculo
			if(!id) return await request.reply({ content: `⚠️ Debes ingresar una TuberID válida\n${helpstr}` });

			switch(operation) {
				case 'crear':
					if(id.length > 24)
						return await request.reply({ content: '⚠️ Las TuberID solo pueden medir hasta 24 caracteres' });
					if(gcfg.tubers[id] && isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
						return await request.reply({ content: `⛔ Acción denegada. Esta TuberID **${id}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[id].author) ?? request.guild.me).user.username}*` });
					
					const tuberContent = { author: (request.user ?? request.author).id };
					const mcontent = (isSlash ? options.getString('mensaje') : args.join(' ')).split(/[\n ]*#FIN#[\n ]*/).join('\n');
					const mfiles = isSlash ? options.fetchParamPoly(args, 'archivos', args.getString, null).filter(att => att) : (request.attachments || []).map(att => att.proxyURL);

					//Incluir Tubérculo; crear colección de Tubérculos si es necesario
					if(ps) {
						if(!mcontent)
							return await request.reply({ content: `⚠️ Este Tubérculo requiere ingresar PuréScript\n${helpstr}` });
						tuberContent.script = mcontent.split(/ *;+ */).map(line => line.split(/ +/).filter(word => word !== '```')).filter(line => line.length);
					} else {
						if(!mcontent && !mfiles.length)
							return await request.reply({ content: `⚠️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpstr}` });
						if(mcontent) tuberContent.content = mcontent;
						if(mfiles.length) tuberContent.files = mfiles;
					}

					gcfg.tubers[id] = tuberContent;
					
					try {
						console.log('Ejecutando PuréScript:', gcfg.tubers[id]);
						await executeTuber(request, gcfg.tubers[id], { isSlash });
						console.log('PuréScript ejecutado:', gcfg.tubers[id]);
						if(gcfg.tubers[id].script) {
							gcfg.tubers[id].script = gcfg.tubers[id].script.filter(expr => expr && expr.some(w => w));
							console.log('Script guardado:', gcfg.tubers[id].script);
						}
						gcfg.markModified('tubers');
					} catch(error) {
						console.log('Ocurrió un error al añadir un nuevo Tubérculo');
						console.error(error);
						return await request.reply({ content: '❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará' });
					}
					break;

				case 'ver':
					const item = gcfg.tubers[id];
					if(!item)
						return await request.reply({ content: `⚠️ El Tubérculo **${id}** no existe` });

					const embed = new MessageEmbed()
					.setColor('DARK_VIVID_PINK')
					.setAuthor(request.guild.name, request.guild.iconURL())
					.addField('Visor de Tubérculos', [
						`**TuberID** ${id}`,
						`**Autor** ${(request.guild.members.cache.get(item.author) ?? request.guild.me).user.username}`,
						`**Descripción** ${item.desc ?? '*Este Tubérculo no tiene descripción*'}`,
					].join('\n'));
					
					if(item.script)
						embed.addField('PuréScript', [
							`**Entradas** \`[${(item.inputs ?? []).map(i => i.identifier).join(', ')}]\``,
							'```',
							`${item.script.map(expr => expr.join(' ')).join(';\n')}`,
							'```',
						].join('\n'));
					else {
						if(item.content) embed.addField('Mensaje', item.content);
						if(item.files && item.files.length) embed.addField('Archivos', item.files.map((f,i) => `[${i}](${f})`).join(', '));
					}

					return await request.reply({
						embeds: [embed],
						//components: *algo*,
					});
				
				case 'borrar':
					if(!gcfg.tubers[id])
						return await request.reply({ content: `⚠️ El Tubérculo **${id}** no existe` });
					if(isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
						return await request.reply({ content: `⛔ Acción denegada. Esta TuberID **${id}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[id].author) ?? request.guild.me).user.username}*` });

					gcfg.tubers[id] = null;
					delete gcfg.tubers[id];
					gcfg.markModified('tubers');
					request.reply({ content: '✅ Tubérculo eliminado con éxito' });
					break;
				
				default:
					if(!gcfg.tubers[id]) return await request.reply({
						content: [
							`⚠️ El Tubérculo **${id}** no existe`,
							ps ? '¿Estás intentando crear un Tubérculo con PuréScript? Usa la bandera `--crear` junto a `--script` (o `-cs` para la versión corta)' : undefined,
						].filter(str => str).join('\n'),
					});
					await executeTuber(request, gcfg.tubers[id], { args, isSlash })
					.catch(error => {
						console.log('Ocurrió un error al ejecutar un Tubérculo');
						console.error(error);
						request.reply({ content: '❌ Parece que hay un problema con este Tubérculo. Prueba creándolo nuevamente o eliminándolo si no se usa más' });
					});
					break;
			}
		}
		gcfg.save(); //Guardar en Configuraciones de Servidor si se cambió algo
	},

	async getItemsList(guild, content, page) {
		const gcfg = await GuildConfig.findOne({ guildId: guild.id });
		let items = Object.entries(gcfg.tubers).reverse();
		if(content) {
			const filter = content.split(': ');
			const [ focus, value ] = filter;
			if(focus === 'Autor')
				items = items.filter(([_,tuber]) => tuber.author === value);
			else
				items = items.filter(([tid,_]) => tid === value);
		}

		const lastPage = Math.ceil(items.length / pageMax) - 1;
		const backward = (page > 0) ? (page - 1) : lastPage;
		const forward = (page < lastPage) ? (page + 1) : 0;
		
		return {
			items,
			lastPage,
			backward,
			forward,
		};
	},

	/**
	 * 
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<any>} param1 
	 */
	async ['loadPage'](interaction, [ page ]) {
		page = parseInt(page);
		const { guild, message } = interaction;
		const { items, lastPage, backward, forward } = await module.exports.getItemsList(guild, message.content, page);
		const members = guild.members.cache;
		const oembed = message.embeds[0];

		return await interaction.update({
			embeds: [
				new MessageEmbed()
					.setColor(oembed.color)
					.setAuthor(oembed.author.name, oembed.author.url)
					.setTitle(oembed.title)
					.addField(`🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${page + 1} / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
						items.length
							? items.splice(page * pageMax, pageMax)
								.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
								.join('\n')
							: `Ningún Tubérculo coincide con la búsqueda actual`,
						true,
					),
			],
			components: (items.length < pageMax) ? null : paginationRows(page, backward, forward, lastPage),
		});
	},

	/**
	 * 
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<any>} param1 
	 */
	async ['filterAuthor'](interaction) {
		const { guild, client, message } = interaction;
		const members = guild.members.cache;
		const oembed = message.embeds[0];

		const filter = (m) => m.author.id === interaction.user.id;
		const filterCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 2 });
		filterCollector.on('collect', async collected => {
			const userId = fetchUserID(collected.content, { guild, client });
			if(!userId) return;
			const content = `Autor: ${userId}`
			const { items, lastPage, backward, forward } = await module.exports.getItemsList(guild, content, 0);
			await interaction.message.edit({
				content,
				embeds: [
					new MessageEmbed()
						.setColor(oembed.color)
						.setAuthor(oembed.author.name, oembed.author.url)
						.setTitle(oembed.title)
						.addField(`🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ 1 / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
							items.length
								? items.splice(0, pageMax)
									.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
									.join('\n')
								: `Ningún Tubérculo coincide con la búsqueda actual`,
							true,
						),
				],
				components: (items.length < pageMax) ? null : paginationRows(0, backward, forward, lastPage),
			});
			filterCollector.stop();
		});

		await interaction.reply({
			content: 'Envía el usuario a filtrar',
			ephemeral: true,
		});
	},

	/**
	 * 
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<any>} param1 
	 */
	async ['filterTuberID'](interaction) {
		const { guild, message } = interaction;
		const members = guild.members.cache;
		const oembed = message.embeds[0];

		const filter = (m) => m.author.id === interaction.user.id;
		const filterCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 2 });
		filterCollector.on('collect', async collected => {
			const content = `TuberID: ${collected.content}`;
			const { items, lastPage, backward, forward } = await module.exports.getItemsList(guild, content, 0);
			await interaction.message.edit({
				content,
				embeds: [
					new MessageEmbed()
						.setColor(oembed.color)
						.setAuthor(oembed.author.name, oembed.author.url)
						.setTitle(oembed.title)
						.addField(`🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ 1 / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
							items.length
								? items.splice(0, pageMax)
									.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
									.join('\n')
								: `Ningún Tubérculo coincide con la búsqueda actual`,
							true,
						),
				],
				components: (items.length < pageMax) ? null : paginationRows(0, backward, forward, lastPage),
			});
			filterCollector.stop();
		});

		await interaction.reply({
			content: 'Envía una TuberID a filtrar',
			ephemeral: true,
		});
	},

	/**
	 * 
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<any>} param1 
	 */
	async ['filterClear'](interaction) {
		if(interaction.message.content) {
			await interaction.message.edit({ content: null });
			return await module.exports['loadPage'](interaction, [0]);
		} else
			return await interaction.reply({
				content: '⚠ Esta lista ya muestra todos los resultados',
				ephemeral: true,
			});
	},

	/**
	 * 
	 * @param {import('discord.js').SelectMenuInteraction} interaction
	 */
	async ['loadPageExact'](interaction) {
		module.exports['loadPage'](interaction, [ interaction.values[0] ]);
	},
};