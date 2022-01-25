const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');
const { p_pure } = require('../../localdata/prefixget.js');
const { fetchFlag, isNotModerator } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const options = new CommandOptionsManager()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar')
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',     { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje', { poly: 'MULTIPLE', optional: true })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo')
	.addFlag('s', 		['script','puré','pure'], 	  'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`');

const pageMax = 10;
const paginationRows = (page, backward, forward, lastPage) => {
	let i = 0;
	return [
		new MessageActionRow().addComponents(
			new MessageButton()
			.setCustomId('tubérculo_loadPage_0_START')
			.setEmoji('934430008586403900')
			.setStyle('PRIMARY'),
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
				.setStyle('PRIMARY'),
			new MessageButton()
				.setCustomId(`tubérculo_loadPage_${page}_RELOAD`)
				.setEmoji('934432754173624373')
				.setStyle('SUCCESS'),
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
		'common'
	],
	options,
	callx: '<mensaje?> <archivos?>',
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
				args.getBoolean('crear' ),
				args.getBoolean('borrar'),
			] : [
				fetchFlag(args, { ...options.flags.get('crear').structure,  callback: 'crear'  }),
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
		/**
		 * @param {{author: String, content?: String | null, files?: Array<String>, script?: Array<Array<String>>}} tuber 
		 */
		const executeTuber = async(tuber) => {
			if(tuber.script) {
				let replyContent = {};
				let mem = { //Memoria del script, para cachear
					archivos: isSlash ? [] : request.attachments.map(attachment => attachment.proxyURL),
				};
				console.log('mem:', mem);
				const psError = (description, line, operation) => request.reply({ content: `<⚠️ Error: \`${description} (Expresión ${line + 1}, Operación ${operation.toUpperCase()})\`>` });
				const getLineString = (expression) => expression.join(' ').split(/[\n ]*#FIN#[\n ]*/).join('\n');
				const getAttribute = (sequence) => {
					let att = mem[sequence.shift()];
					//console.log('getAttribute:', sequence, ',', str, '| att:', att);
					sequence.forEach(a => {
						if(att[a].startsWith('$'))
							att = getAttribute(sequence);
						else
							att = att[sequence.shift()];
					});
					return att;
				}
				//Leer valores o punteros
				const readReference = (str) => {
					let reference;
					console.log('str inicial:', str);
					if(str[0].startsWith('$')) {
						const sequence = str[0].slice(1).split('->');
						console.log('Secuencia:', sequence.length, 'pasos');
						reference = getAttribute(sequence, str[0]);
					} else
						reference = getLineString(str);
					return reference;
				}
				
				const readLineReferences = (str) => {
					let references = [];
					console.log('str inicial:', str);
					str.forEach(w => {
						if(w.startsWith('$')) {
							const sequence = w.slice(1).split('->');
							console.log('Secuencia:', sequence.length, 'pasos');
							references.push(getAttribute(sequence, w));
						} else
							references.push(w);
					});
					console.log(references);
					
					return references;
				}

				//Ejecutar secuencia de expresiones
				let errors = 0;
				await Promise.all(tuber.script.map((expression, l) => {
					const expr = [ ...expression ];
					let working = Promise.resolve(); //Promesa para cuando se estén realizando trabajos de fondo
					const operation = expr.shift().toLowerCase();
					console.log('concha de tu hermana', tuber.script);
					let target, identifier, values;
					switch(operation) {
						case 'crear':
							console.log('Operación CREAR');
							if(!expr.length) return psError('se esperaba contexto', l, operation);
							target = expr.shift().toLowerCase();
							if(!expr.length) return psError('se esperaba un identificador', l, operation);
							identifier = expr.shift();

							switch(target) {
								case 'lista':
									mem[identifier] = [];
									break;

								case 'conjunto':
									mem[identifier] = {};
									break;

								case 'texto':
									if(!expr.length) return psError('se esperaba un valor', l, operation);
									mem[identifier] = '';
									break;

								case 'recuadro':
									if(!expr.length) return psError('se esperaba un valor', l, operation);
									mem[identifier] = new MessageEmbed();
									break;

								default:
									return psError('contexto inválido', l, operation);
							}
							console.log(mem);
							break;

						case 'guardar':
							console.log('Operación GUARDAR');
							return psError('esta característica todavía no está disponible', l, operation);

						case 'cargar':
							console.log('Operación CARGAR');
							if(!expr.length) return psError('se esperaba un identificador', l, operation);
							identifier = expr.shift();
							if(!expr.length) return psError('se esperaba un valor', l, operation);
							if(identifier.startsWith('$')) {
								let memtemp = readReference(expr);
								console.log(memtemp);
								const sequence = identifier.slice(1).split('->');
								if(!sequence.length) return psError('se esperaba un identificador', l, operation);
								sequence.slice(0).reverse().forEach(sq => {
									memtemp = { [`${sq}`]: memtemp };
									console.log(memtemp);
								});
								console.log('wasd', sequence[0], 'fg', mem[sequence[0]]);
								
								mem = { ...mem, ...memtemp };
							} else
								mem[identifier] = readReference(expr);
							
							console.log(mem);
							break;

						case 'enviar':
							console.log('Operación ENVIAR');
							const message = {};
							target = expr.shift().toLowerCase();
							values = readLineReferences(expr);
							if(!values.length) return psError('el valor especificado no existe', l, operation);
							
							switch(target) {
								case 'archivos':
									message.files = values;
									console.log('message.files:', message.files);
									break;

								case 'recuadros':
									message.embeds = values;
									console.log('message.files:', message.files);
									break;

								case 'texto':
									message.content = values.join(' ');
									break

								default:
									return psError('se esperaba contenido de mensaje', l, operation);
							}
							replyContent = { ...replyContent, ...message };


						default:
							console.log('Operación *');
							break;
					}
					return working;
				}));
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
		gcfg.tubers = gcfg.tubers || {};

		if(!operation && !id) { //Listar Tubérculos
			const items = Object.entries(gcfg.tubers).reverse();
			const lastPage = Math.ceil(items.length / pageMax) - 1;
			request.reply({
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
						)
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
						tuberContent.script = mcontent.split(/ *;+ */).filter(line => line.length).map(line => line.split(/ +/));
					} else {
						if(!mcontent && !mfiles.length)
							return await request.reply({ content: `⚠️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpstr}` });
						tuberContent.content = mcontent || null;
						tuberContent.files = mfiles;
					}

					console.log('a', tuberContent);
					gcfg.tubers[id] = tuberContent;
					console.log('b', gcfg.tubers[id]);
					
					try {
						await executeTuber(gcfg.tubers[id]);
						console.log('c', gcfg.tubers[id]);
						gcfg.markModified('tubers');
					} catch(error) {
						console.log('Ocurrió un error al añadir un nuevo Tubérculo');
						console.error(error);
						return await request.reply({ content: '❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará' });
					}
					break;
				
				case 'borrar':
					if(!gcfg.tubers[id])
						return await request.reply({ content: `⚠️ El Tubérculo **${id}** no existe` });
					if(isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
						return await request.reply({ content: `⛔ Acción denegada. Esta TuberID **${id}** le pertenece a *${gcfg.tubers[id].author}*` });

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
					await executeTuber(gcfg.tubers[id])
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

	/**
	 * 
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<any>} param1 
	 */
	async ['loadPage'](interaction, [ page ]) {
		page = parseInt(page);
		const { guild, message } = interaction;
		const gcfg = await GuildConfig.findOne({ guildId: guild.id });
		const items = Object.entries(gcfg.tubers).reverse();
		
		const members = guild.members.cache;
		const lastPage = Math.ceil(items.length / pageMax) - 1;
		const backward = (page > 0) ? (page - 1) : lastPage;
		const forward = (page < lastPage) ? (page + 1) : 0;
		const oembed = message.embeds[0];
		return await interaction.update({
			embeds: [
				new MessageEmbed()
				.setColor(oembed.color)
				.setAuthor(oembed.author.name, oembed.author.url)
				.setTitle(oembed.title)
				.addField(`🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${page + 1} / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
					items.splice(page * pageMax, pageMax)
						.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
						.join('\n'), true)
			],
			components: (items.length < pageMax) ? null : paginationRows(page, backward, forward, lastPage),
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