const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { isNotModerator, fetchUserID, navigationRows, edlDistance, shortenText } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment, Modal, TextInputComponent } = require('discord.js');
const { ProgramToLanguage } = require('../../systems/ps/commons.js');
const { executeTuber } = require('../../systems/purescript.js');

const pageMax = 10;
const filters = {
	AUTHOR: {
		label: 'Autor',
		placeholder: 'Ej: @Bot de Puré#9243 / 651250669390528561',
	},
	TID: {
		label: 'TuberID',
		placeholder: 'Identificador de Tubérculo existente',
	},
};

/**
 * Retorna un arreglo de MessageActionRows en respecto a la página actual y si la navegación por página está permitida
 * @param {Number} page 
 * @param {Number} backward 
 * @param {Number} forward 
 * @param {Number} lastPage 
 * @param {Boolean} navigationEnabled 
 * @returns {Array<MessageActionRow>}
 */
const paginationRows = (page, lastPage, navigationEnabled = true) => {
	const rows = [];

	if(navigationEnabled)
		rows.push(...navigationRows('tubérculo', page, lastPage));

	rows.push(
		new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId('tubérculo_filterItems_AUTHOR')
				.setLabel('Filtrar Autor')
				.setEmoji('936530498061213756')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId('tubérculo_filterItems_TID')
				.setLabel('Filtrar TuberID')
				.setEmoji('936530498061213756')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId('tubérculo_filterClear')
				.setLabel('Mostrar todo')
				.setEmoji('936531643496288288')
				.setStyle('DANGER'),
		),
	);
	return rows;
};

/**
 * @param {import('discord.js').Guild} guild 
 * @param {String?} content 
 */
const getItemsList = async(guild, content) => {
	const gcfg = await GuildConfig.findOne({ guildId: guild.id });
	/**@type {Array<[String, String]>}*/
	let items = Object.entries(gcfg.tubers).reverse();
	if(content) {
		const filter = content.split(': ');
		const [ target, value ] = filter;
		if(target === 'Autor')
			items = items.filter(([_,tuber]) => tuber.author === value);
		else
			items = items.filter(([tid,_]) => tid.toLowerCase().indexOf(value) !== -1);
	}

	const lastPage = Math.ceil(items.length / pageMax) - 1;
	
	return { items, lastPage };
};

/**
 * @param {import('discord.js').ButtonInteraction | import('discord.js').SelectMenuInteraction} interaction 
 * @param {Number} page 
 */
const loadPageNumber = async(interaction, page, setFilter = undefined) => {
	page = parseInt(page);
	const { guild, message } = interaction;
	const { items, lastPage } = await getItemsList(guild, setFilter ?? message.content, page);
	const members = guild.members.cache;
	const oembed = message.embeds[0];
	const paginationEnabled = items.length >= pageMax

	const listUpdate = {
		embeds: [
			new MessageEmbed()
				.setColor(oembed.color)
				.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
				.setTitle(oembed.title)
				.addFields({
					name: `🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${page + 1} / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
					value: 
						items.length
							? items.splice(page * pageMax, pageMax)
								.map(([tid,tuber]) => `${tuber.script ? '`📜`' : ''}**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
								.join('\n')
							: `Ningún Tubérculo coincide con la búsqueda actual`,
					inline: true,
				})
				.setFooter({ iconUrl: guild.iconURL({ dynamic: true, size: 256 }), text: `Total • ${items.length}` }),
		],
		components: paginationRows(page, lastPage, paginationEnabled),
	};

	if(setFilter !== undefined) {
		if(setFilter)
			listUpdate.content = setFilter;
		else
			listUpdate.content = null;
	}

	return interaction.update(listUpdate);
};

const options = new CommandOptionsManager()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar', { optional: true })
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',       { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje',   { optional: true, poly: 'MULTIPLE' })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag('v', 		'ver', 		  				  'para ver detalles de un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo')
	.addFlag('s', 		['script','puré','pure'], 	  'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`');
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('tubérculo', flags)
	.setAliases('tuberculo', 'tubercle', 'tuber', 't')
	.setBriefDescription('Permite crear, editar, listar, borrar o ejecutar comandos personalizados de servidor')
	.setLongDescription(
		'Permite *listar*, `--crear`/editar, `--borrar` o __ejecutar__ Tubérculos (comandos personalizados de servidor).',
		'Usar el comando sin más listará todos los Tubérculos de los que dispone el servidor actual',
		'En caso de estar creando un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya está registrada, será *editada*',
		'En cualquier parte del contenido del mensaje, coloca "#FIN#" para bajar un renglón (no es necesario con PuréScript)',
		'En caso de estar editando o borrando un Tubérculo existente, se requerirá su TuberID',
		'Puedes leer o descargar la documentación de la versión 1.0 de PuréScript desde [aquí](https://drive.google.com/file/d/1KebeyvsjJUqpInvCiy8wlOJ-M_ewrTch/view?usp=share_link) (3MB)',
		'Nótese que el lenguaje se encuentra en una etapa prematura y puede tener bugs o cambiar considerablemente',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false, rawArgs) => {
		const helpString = `Usa \`${p_pure(request.guildId).raw}ayuda tubérculo\` para más información`;
		const operation = options.fetchFlag(args, 'crear', { callback: 'crear' })
			|| options.fetchFlag(args, 'ver', { callback: 'ver' })
			|| options.fetchFlag(args, 'borrar', { callback: 'borrar' });
		const isPureScript = options.fetchFlag(args, 'script');

		/**@type {String?}*/
		const tuberId = isSlash ? args.getString('id') : args.shift();
		const members = request.guild.members.cache;

		if(!tuberId) {
			if(operation)
				return request.reply({ content: `⚠️ Debes ingresar una TuberID válida\n${helpString}` });
				
			//Listar Tubérculos
			const { items, lastPage } = await getItemsList(request.guild);
			return request.reply({
				embeds: [
					new MessageEmbed()
						.setColor('LUMINOUS_VIVID_PINK')
						.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL() })
						.setTitle('Arsenal de Tubérculos del Servidor')
						.addFields({
							name: `🥔)▬▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${items.length ? `1 / ${lastPage + 1}` : '- - -'} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬▬(🥔`, 
							value: items.length
								? items.splice(0, pageMax)
									.map(([tid,tuber]) => `${tuber.script ? '`📜`' : ''}**${tid}** • ${(members.get(tuber.author) ?? request.guild.me).user.username}`)
									.join('\n')
								: `Este servidor no tiene ningún Tubérculo.\nComienza a desplegar TuberIDs con \`${p_pure(request.guildId).raw}tubérculo --crear\``,
							inline: true,
						})
						.setFooter({ iconUrl: request.guild.iconURL({ dynamic: true, size: 256 }), text: `Total • ${items.length}` }),
				],
				components: (items.length < pageMax) ? null : paginationRows(0, lastPage),
			});
		}

		//Realizar operación sobre ID de Tubérculo
		const gid = request.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		gcfg.tubers ||= {};
		switch(operation) {
			case 'crear':
				if(tuberId.length > 24)
					return request.reply({ content: '⚠️ Las TuberID solo pueden medir hasta 24 caracteres' });
				if(gcfg.tubers[tuberId] && isNotModerator(request.member) && gcfg.tubers[tuberId].author !== (request.author ?? request.user).id)
					return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? request.guild.me).user.username}*` });
				
				const tuberContent = { author: (request.user ?? request.author).id };
				const codeTag = rawArgs.match(/```[A-Za-z0-9]*/)?.[0];
				/**@type {String}*/
				let mcontent;
				if(isSlash)
					mcontent = args.getString('mensaje');
				else {
					if(!codeTag)
						return request.reply({
							content: [
								'Debes poner **\\`\\`\\`** antes y después del código.',
								'Esto hará que Discord le ponga el formato adecuado al código y que sea más fácil programar.',
								'Opcionalmente, puedes poner **\\`\\`\\`arm** en el del principio para colorear el código'
							].join('\n'),
						});
					const firstIndex = rawArgs.indexOf(codeTag);
					const lastIndex = rawArgs.lastIndexOf('```');
					mcontent = rawArgs.slice(firstIndex + codeTag.length, lastIndex > firstIndex ? lastIndex : rawArgs.length).trim();
				}
				const mfiles = isSlash ? options.fetchParamPoly(args, 'archivos', args.getString, null).filter(att => att) : (request.attachments || []).map(att => att.proxyURL);

				//Incluir Tubérculo; crear colección de Tubérculos si es necesario
				if(isPureScript) {
					if(!mcontent)
						return request.reply({ content: `⚠️ Este Tubérculo requiere ingresar PuréScript\n${helpString}` });
					tuberContent.script = mcontent.replace('```arm', '');
					console.log({ script: tuberContent.script });
				} else {
					if(!mcontent && !mfiles.length)
						return request.reply({ content: `⚠️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpString}` });
					if(mcontent) tuberContent.content = mcontent;
					if(mfiles.length) tuberContent.files = mfiles;
				}

				gcfg.tubers[tuberId] = tuberContent;
				
				try {
					console.log('Ejecutando PuréScript:', gcfg.tubers[tuberId]);
					const result = await executeTuber(request, gcfg.tubers[tuberId], { isSlash });
					console.log('PuréScript ejecutado:', gcfg.tubers[tuberId]);
					if(gcfg.tubers[tuberId].script) {
						gcfg.tubers[tuberId].script = gcfg.tubers[tuberId].script;
						
						console.log('Script guardado:', gcfg.tubers[tuberId].script);
					}
					gcfg.markModified('tubers');
				} catch(error) {
					console.log('Ocurrió un error al añadir un nuevo Tubérculo');
					console.error(error);
					return request.reply({ content: '❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará' });
				}
				break;

			case 'ver':
				const item = gcfg.tubers[tuberId];
				if(!item)
					return request.reply({ content: `⚠️ El Tubérculo **${tuberId}** no existe` });

				let files = [];
				const embed = new MessageEmbed()
					.setColor('DARK_VIVID_PINK')
					.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL() })
					.setTitle('Visor de Tubérculos')
					.addFields(
						{
							name: 'TuberID',
							value: tuberId,
							inline: true,
						},
						{
							name: 'Autor',
							value: (request.guild.members.cache.get(item.author) ?? request.guild.me).user.username,
							inline: true,
						},
					);
				
				if(item.desc)
					embed.addFields({
						name: 'Descripción',
						value: item.desc ?? '*Este Tubérculo no tiene descripción*',
					});
				
				if(item.script) {
					if(item.inputs?.length)
						embed.addFields({
							name: 'Entradas',
							value: item.inputs.map(i => `**(${ProgramToLanguage.get(i.type)})** \`${i.name}\`: ${i.description ?? 'Sin descripción'}`).join('\n'),
						});
					const visualPS = item.script.map
						? item.script.map(expr => expr.join(' ')).join(';\n')
						: item.script;
					if(visualPS.length >= 1020)
						files = [new MessageAttachment(Buffer.from(visualPS, 'utf-8'), 'PuréScript.txt')];
					else
						embed.addFields({
							name: 'PuréScript',
							value: [
								'```arm',
								`${visualPS}`,
								'```',
							].join('\n'),
						});
				} else {
					if(item.content) embed.addFields({ name: 'Mensaje', value: item.content });
					if(item.files && item.files.length) embed.addFields({
						name: 'Archivos',
						value: item.files.map((f,i) => `[${i}](${f})`).join(', '),
					});
				}

				return request.reply({
					embeds: [embed],
					files,
					//components: *algo*,
				});
			
			case 'borrar':
				if(!gcfg.tubers[tuberId])
					return request.reply({ content: `⚠️ El Tubérculo **${tuberId}** no existe` });
				if(isNotModerator(request.member) && gcfg.tubers[tuberId].author !== (request.author ?? request.user).id)
					return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? request.guild.me).user.username}*` });

				gcfg.tubers[tuberId] = null;
				delete gcfg.tubers[tuberId];
				gcfg.markModified('tubers');
				request.reply({ content: '✅ Tubérculo eliminado con éxito' });
				break;
			
			default:
				if(!gcfg.tubers[tuberId]) {
					const notFoundEmbed = new MessageEmbed()
						.setColor('ORANGE')
						.setTitle(`⚠️ El Tubérculo **${tuberId}** no existe`)
						.setImage('https://i.imgur.com/LFzqoJX.jpg');

					const row = new MessageActionRow().addComponents(
						new MessageButton()
							.setCustomId(`tubérculo_getHelp_${(request.author ?? request.user).id}`)
							.setLabel('Necesito ayuda')
							.setEmoji('💡')
							.setStyle('PRIMARY'),
					);

					let similar;
					if(tuberId.length > 1)
						similar = Object.keys(gcfg.tubers)
							.filter(name => name.length > 1)
							.map(name => ({ name, distance: edlDistance(tuberId, name) }))
							.filter(t => t.distance <= 3.5);

					if(similar.length) {
						similar = similar
							.sort((a, b) => a.distance - b.distance)
							.slice(0, 5);
						
						notFoundEmbed.addFields({
							name: `TuberIDs similares a "${shortenText(tuberId, 80)}"`,
							value: similar.map(t => `• **${shortenText(t.name, 152)}** (~${Math.round(100 - t.distance / 3.5 * 100)}%)`).join('\n'),
						});
					} else
						notFoundEmbed.addFields({
							name: 'Creación de Tubérculos',
							value: [
								`No se encontraron Tubérculos similares a "${shortenText(tuberId, 80)}".`,
								'¿Quieres crear un Tubérculo simple? ¡Usa la bandera `--crear` y maqueta la respuesta que desees!',
							].join('\n'),
						});
					
					if(isPureScript)
						notFoundEmbed.addFields({
							name: 'Crear Tubérculo avanzado',
							value: '¿Estás intentando crear un Tubérculo con PuréScript? Usa la bandera `--crear` junto a `--script` (o `-cs` para la versión corta)',
						});
					
					return request.reply({
						embeds: [notFoundEmbed],
						components: [row],
					});
				}
				console.log(args);
				const tuberArgs = Array.isArray(args)
					? args
					: options.fetchParamPoly(args, 'entradas', args.getString, null).filter(input => input);
				console.log('tuberArgs:', tuberArgs);
				await executeTuber(request, gcfg.tubers[tuberId], { tuberArgs, isSlash })
				.catch(error => {
					console.log('Ocurrió un error al ejecutar un Tubérculo');
					console.error(error);
					request.reply({ content: '❌ Parece que hay un problema con este Tubérculo. Prueba creándolo nuevamente o eliminándolo si no se usa más' });
				});
				break;
		}
		return gcfg.save(); //Guardar en Configuraciones de Servidor si se cambió algo
	})
	.setButtonResponse(function getHelp(interaction, userId) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: 'No tienes permiso para hacer eso', ephemeral: true });
		return require('./ayuda.js').execute(interaction, [ 'tubérculo' ], false);
	})
	.setButtonResponse(async function loadPage(interaction, page) {
		return loadPageNumber(interaction, page);
	})
	.setButtonResponse(async function filterItems(interaction, target) {
		const filter = filters[target];

		const filterInput = new TextInputComponent()
			.setCustomId('filterInput')
			.setLabel(filter.label)
			.setPlaceholder(filter.placeholder)
			.setStyle('SHORT')
			.setMaxLength(48)
			.setRequired(true);
		const row = new MessageActionRow().addComponents(filterInput);
		const modal = new Modal()
			.setCustomId(`tubérculo_filterSubmit_${target}`)
			.setTitle('Filtro de búsqueda')
			.addComponents(row);

		return interaction.showModal(modal);
	})
	.setModalResponse(async function filterSubmit(interaction, target) {
		const { guild, client } = interaction;
		
		let filter = interaction.fields.getTextInputValue('filterInput');
		if(target === 'AUTHOR') {
			if(filter.startsWith('@'))
				filter = filter.slice(1);
			const userId = fetchUserID(filter, { guild, client });
			if(!userId)
				return interaction.reply({
					content: '⚠ Usuario no encontrado',
					ephemeral: true
				});
			filter = userId;
		}
		const content = `${filters[target].label}: ${filter}`;
		return loadPageNumber(interaction, 0, content);
	})
	.setButtonResponse(async function filterClear(interaction) {
		if(!interaction.message.content)
			return interaction.reply({
				content: '⚠ Esta lista ya muestra todos los resultados',
				ephemeral: true,
			});
			
		return loadPageNumber(interaction, 0, '');
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		return loadPageNumber(interaction, interaction.values[0]);
	});

module.exports = command;