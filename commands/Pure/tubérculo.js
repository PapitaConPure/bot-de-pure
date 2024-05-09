const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { isNotModerator, fetchUserID, navigationRows, edlDistance, shortenText, compressId, decompressId } = require('../../func.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, TextInputBuilder, CommandInteraction, ButtonInteraction, ButtonStyle, TextInputStyle, Colors, ModalBuilder, AttachmentBuilder, ModalSubmitInteraction, StringSelectMenuBuilder, CommandInteractionOptionResolver, Message, ChatInputCommandInteraction } = require('discord.js');
const { RuntimeToLanguageType } = require('../../systems/ps/commons.js');
const { executeTuber } = require('../../systems/purescript.js');
const { makeButtonRowBuilder, makeTextInputRowBuilder } = require('../../tsCasts.js');

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
 * Retorna un arreglo de ActionRowBuilders en respecto a la página actual y si la navegación por página está permitida
 * @param {Number} page 
 * @param {Number} lastPage 
 * @param {Boolean} [navigationEnabled=true] 
 */
function paginationRows(page, lastPage, navigationEnabled = true) {
	/**@type {Array<ActionRowBuilder<ButtonBuilder>|ActionRowBuilder<StringSelectMenuBuilder>>}*/
	const rows = [];

	if(navigationEnabled)
		rows.push(...navigationRows('tubérculo', page, lastPage));

	rows.push(
		makeButtonRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('tubérculo_filterItems_AUTHOR')
				.setLabel('Filtrar Autor')
				.setEmoji('936530498061213756')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('tubérculo_filterItems_TID')
				.setLabel('Filtrar TuberID')
				.setEmoji('936530498061213756')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('tubérculo_filterClear')
				.setLabel('Mostrar todo')
				.setEmoji('936531643496288288')
				.setStyle(ButtonStyle.Danger),
		),
	);
	return rows;
}
const helpRows = () => [
	makeButtonRowBuilder().addComponents(
		new ButtonBuilder()
			.setURL('https://drive.google.com/drive/folders/1wv2-n4J5SSZNH9oQ5gNEPpptm7rNFEnV?usp=share_link')
			.setLabel('Aprende PuréScript')
			.setEmoji('📖')
			.setStyle(ButtonStyle.Link),
	)
];

/**
 * @param {import('discord.js').Guild} guild 
 * @param {String} [content] 
 */
async function getItemsList(guild, content = undefined) {
	const gcfg = await GuildConfig.findOne({ guildId: guild.id });
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
}

/**
 * @param {import('discord.js').ButtonInteraction | import('discord.js').SelectMenuInteraction | ModalSubmitInteraction} interaction 
 * @param {Number} page 
 * @param {String} [setFilter]
 */
async function loadPageNumber(interaction, page, setFilter = undefined) {
	const { guild, message } = interaction;
	const { items, lastPage } = await getItemsList(guild, setFilter ?? message.content);
	const members = guild.members.cache;
	const oembed = message.embeds[0];
	const paginationEnabled = items.length >= pageMax

	/**@type {import('discord.js').MessageEditOptions}*/
	const listUpdate = {
		embeds: [
			new EmbedBuilder()
				.setColor(oembed.color)
				.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
				.setTitle(oembed.title)
				.addFields({
					name: `🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${page + 1} / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
					value: 
						items.length
							? items.splice(page * pageMax, pageMax)
								.map(([tid,tuber]) => `${tuber.script ? '`📜`' : ''}**${tid}** • ${(members.get(tuber.author) ?? guild.members.me).user.username}`)
								.join('\n')
							: `Ningún Tubérculo coincide con la búsqueda actual`,
					inline: true,
				})
				.setFooter({ iconURL: guild.iconURL({ size: 256 }), text: `Total • ${items.length}` }),
		],
		components: [
			...paginationRows(page, lastPage, paginationEnabled),
			...helpRows(),
		],
	};

	if(setFilter !== undefined) {
		if(setFilter)
			listUpdate.content = setFilter;
		else
			listUpdate.content = null;
	}

	if(interaction.isModalSubmit())
		return interaction.message.edit(listUpdate);
	else
		return interaction.update(listUpdate);
};

/**
 * 
 * @param {import('../Commons/typings.js').ComplexCommandRequest|ButtonInteraction<'cached'>} interaction 
 * @param {*} item 
 * @param {*} tuberId 
 * @returns 
 */
function viewTuber(interaction, item, tuberId) {
	if(!item) {
		//@ts-expect-error
		return interaction.reply({ content: `⚠️️ El Tubérculo **${tuberId}** no existe` });
	}

	const author = interaction.guild.members.cache.get(item.author) ?? interaction.guild.members.me;

	let buttons = [
		new ButtonBuilder()
			.setCustomId(`t_getDesc_${tuberId}_${compressId(item.author)}`)
			.setLabel('Describir Tubérculo')
			.setEmoji('ℹ')
			.setStyle(ButtonStyle.Primary),
	];
	/**@type {Array<AttachmentBuilder>}*/
	let files = [];
	const embed = new EmbedBuilder()
		.setColor(Colors.DarkVividPink)
		.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ size: 256 }) })
		.setTitle('Visor de Tubérculos')
		.addFields(
			{
				name: 'TuberID',
				value: tuberId,
				inline: true,
			},
			{
				name: 'Autor',
				value: author.user.username,
				inline: true,
			},
		);
	
	if(item.desc)
		embed.addFields({
			name: 'Descripción',
			value: item.desc ?? '*Este Tubérculo no tiene descripción*',
		});
	
	if(item.script) {
		if(item.inputs?.length){
			embed.addFields({
				name: 'Entradas',
				value: item.inputs.map(i => `**(${RuntimeToLanguageType.get(i.type) ?? 'Nada'})** \`${i.name ?? 'desconocido'}\`: ${i.desc ?? 'Sin descripción'}`).join('\n'),
			});
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`t_gID_${tuberId}_${compressId(item.author)}`)
					.setLabel('Describir entrada')
					.setEmoji('🏷')
					.setStyle(ButtonStyle.Success),
			);
		}

		const visualPS = item.script.map
			? item.script.map(expr => expr.join(' ')).join(';\n')
			: item.script;
		if(visualPS.length >= 1020)
			files = [new AttachmentBuilder(Buffer.from(visualPS, 'utf-8'), { name: 'PuréScript.txt' })];
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

	const embeds = [embed];
	const components = [ makeButtonRowBuilder().addComponents(...buttons) ];

	//@ts-expect-error
	return interaction.reply({ embeds, files, components });
}

const options = new CommandOptions()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar',          { optional: true })
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',                { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje',            { optional: true, poly: 'MULTIPLE', polymax: 8 })
	.addParam('entradas', 'TEXT',           'para especificar las entradas del Tubérculo avanzado', { optional: true, poly: 'MULTIPLE', polymax: 8 })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag('v', 		'ver', 		  				  'para ver detalles de un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo')
	.addFlag('s', 		['script','puré','pure'], 	  'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('tubérculo', flags)
	.setAliases('tuberculo', 'tubercle', 'tuber', 't')
	.setBriefDescription('Permite crear, editar, listar, borrar o ejecutar comandos personalizados de servidor')
	.setLongDescription(
		'Permite *listar*, `--crear`/editar, `--borrar` o __ejecutar__ Tubérculos (comandos personalizados de servidor).',
		'Usar el comando sin más listará todos los Tubérculos de los que dispone el servidor actual',
		'En caso de estar creando un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya está registrada, será *editada*',
		'En cualquier parte del contenido del mensaje, coloca "#FIN#" para bajar un renglón (no es necesario con PuréScript)',
		'En caso de estar editando o borrando un Tubérculo existente, se requerirá su TuberID',
		'Puedes leer o descargar la documentación de PuréScript desde [aquí](https://drive.google.com/drive/folders/1wv2-n4J5SSZNH9oQ5gNEPpptm7rNFEnV?usp=share_link) (~3MiB)',
		'Nótese que el lenguaje se encuentra en una etapa prematura y puede tener bugs o cambiar considerablemente',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false, rawArgs) => {
		const helpString = `Usa \`${p_pure(request.guildId).raw}ayuda tubérculo\` para más información`;
		const operation = options.fetchFlag(args, 'crear', { callback: 'crear' })
			|| options.fetchFlag(args, 'ver', { callback: 'ver' })
			|| options.fetchFlag(args, 'borrar', { callback: 'borrar' });
		const isPureScript = options.fetchFlag(args, 'script');

		const tuberId = CommandOptionSolver.asString(await options.fetchParam(args, 'id'));
		const members = request.guild.members.cache;

		if(!tuberId) {
			if(operation)
				return request.reply({ content: `⚠️️ Debes ingresar una TuberID válida\n${helpString}` });
				
			//Listar Tubérculos
			const { items, lastPage } = await getItemsList(request.guild);
			return request.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.LuminousVividPink)
						.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL({ size: 256 }) })
						.setTitle('Arsenal de Tubérculos del Servidor')
						.addFields({
							name: `🥔)▬▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${items.length ? `1 / ${lastPage + 1}` : '- - -'} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬▬(🥔`, 
							value: items.length
								? items.splice(0, pageMax)
									.map(([tid,tuber]) => `${tuber.script ? '`📜`' : ''}**${tid}** • ${(members.get(tuber.author) ?? request.guild.members.me).user.username}`)
									.join('\n')
								: `Este servidor no tiene ningún Tubérculo.\nComienza a desplegar TuberIDs con \`${p_pure(request.guildId).raw}tubérculo --crear\``,
							inline: true,
						})
						.setFooter({ iconURL: request.guild.iconURL({ size: 256 }), text: `Total • ${items.length}` }),
				],
				components: [
					...((items.length < pageMax) ? [] : paginationRows(0, lastPage)),
					...helpRows(),
				],
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
					return request.reply({ content: '⚠️️ Las TuberID solo pueden medir hasta 24 caracteres' });
				if(gcfg.tubers[tuberId] && isNotModerator(request.member) && gcfg.tubers[tuberId].author !== request.user.id)
					return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? request.guild.members.me).user.username}*` });
				
				const tuberContent = { author: request.userId };
				const codeTag = isSlash ? 0 : rawArgs.match(/```[A-Za-z0-9]*/)?.[0];
				/**@type {String}*/
				let mcontent;
				if(isSlash) {
					mcontent = /**@type {CommandInteractionOptionResolver}*/(args).getString('mensaje');
				} else {
					if(isPureScript) {
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
					} else {
						mcontent = /**@type {Array<String>}*/(args).join(' ').split(/[\n ]*##[\n ]*/).join('\n');
					}
				}
				const mfiles = isSlash
					? options.fetchParamPoly(/**@type {CommandInteractionOptionResolver}*/(args), 'archivos', /**@type {CommandInteractionOptionResolver}*/(args).getString, null).filter(att => att)
					: request.attachments.map(att => att.proxyURL);

				//Incluir Tubérculo; crear colección de Tubérculos si es necesario
				if(isPureScript) {
					if(!mcontent)
						return request.reply({ content: `⚠️️ Este Tubérculo requiere ingresar PuréScript\n${helpString}` });
					tuberContent.script = mcontent.replace(/```[A-Za-z0-9]*/, '');
					console.log({ script: tuberContent.script });
				} else {
					if(!mcontent && !mfiles.length)
						return request.reply({ content: `⚠️️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpString}` });
					if(mcontent) tuberContent.content = mcontent;
					if(mfiles.length) tuberContent.files = mfiles;
				}

				gcfg.tubers[tuberId] = tuberContent;
				
				try {
					console.log('Ejecutando PuréScript:', gcfg.tubers[tuberId]);
					gcfg.tubers[tuberId].tuberId = tuberId;
					await request.deferReply();
					await executeTuber(request, gcfg.tubers[tuberId], { isTestDrive: false });
					console.log('PuréScript ejecutado:', gcfg.tubers[tuberId]);
					if(gcfg.tubers[tuberId].script)
						gcfg.tubers[tuberId].script = gcfg.tubers[tuberId].script;
					gcfg.markModified('tubers');
				} catch(error) {
					console.log('Ocurrió un error al añadir un nuevo Tubérculo');
					console.error(error);
					const errorContent = { content: '❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará' };
					return request.editReply(errorContent);
				}
				break;

			case 'ver':
				return viewTuber(request, gcfg.tubers[tuberId], tuberId);
			
			case 'borrar':
				if(!gcfg.tubers[tuberId])
					return request.reply({ content: `⚠️️ El Tubérculo **${tuberId}** no existe` });
				if(isNotModerator(request.member) && gcfg.tubers[tuberId].author !== request.userId)
					return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? request.guild.members.me).user.username}*` });

				gcfg.tubers[tuberId] = null;
				delete gcfg.tubers[tuberId];
				gcfg.markModified('tubers');
				request.reply({ content: '✅ Tubérculo eliminado con éxito' });
				break;
			
			default:
				let tid = tuberId;
				if(!gcfg.tubers[tuberId]) {
					const notFoundEmbed = new EmbedBuilder()
						.setColor(Colors.Orange)
						.setTitle(`⚠️️ El Tubérculo **${shortenText(tuberId, 64)}** no existe`)
						.setImage('https://i.imgur.com/LFzqoJX.jpg');

					const row = makeButtonRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId(`tubérculo_getHelp_${request.userId}`)
							.setLabel('Necesito ayuda')
							.setEmoji('💡')
							.setStyle(ButtonStyle.Primary),
					);

					/**@type {Array<{ name: String, distance: Number }>}*/
					let similar = [];
					let superSimilar;
					if(tuberId.length > 1)
						similar = Object.keys(gcfg.tubers)
							.filter(name => name.length > 1)
							.map(name => ({ name, distance: edlDistance(tuberId, name) }))
							.filter(t => t.distance <= 3.5)
							.sort((a, b) => a.distance - b.distance)
							.slice(0, 5);
					
					if(similar[0]?.distance <= 0 && (similar[1] == undefined || similar[1].distance > 0)) {
						superSimilar = similar[0];
						tid = superSimilar.name;
					}

					if(!superSimilar) {
						if(similar.length) {
							notFoundEmbed.addFields({
								name: `TuberIDs similares a "${shortenText(tuberId, 80)}"`,
								value: similar.map(t => `• **${shortenText(t.name, 152)}** (${t.distance > 0 ? `~${Math.round(100 - t.distance / 3.5 * 100)}` : '>99'}%)`).join('\n'),
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
				}
				console.log(args);
				const tuberArgs = Array.isArray(args)
					? args
					: options.fetchParamPoly(args, 'entradas', args.getString, null).filter(input => input);
				console.log('tuberArgs:', tuberArgs);
				await request.deferReply();
				await executeTuber(request, { ...gcfg.tubers[tid], tuberId: tid }, { args: tuberArgs, isTestDrive: false })
				.catch(error => {
					console.log('Ocurrió un error al ejecutar un Tubérculo');
					console.error(error);
					if(!gcfg.tubers[tid].script && error.name !== 'TuberInitializerError')
						request.editReply({ content: '❌ Parece que hay un problema con este Tubérculo. Si eres el creador, puedes modificarlo o eliminarlo. Si no, avísale al creador' });
				});
				break;
		}
		return gcfg.save(); //Guardar en Configuraciones de Servidor si se cambió algo
	})
	.setButtonResponse(function getHelp(interaction, userId) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: 'No tienes permiso para hacer eso', ephemeral: true });
		
		//@ts-expect-error
		return require('./ayuda.js').execute(interaction, [ 'tubérculo' ], false);
	})
	.setButtonResponse(async function getTuberHelp(interaction, tuberId) {
		if(!tuberId)
			return interaction.reply({ content: '⚠️ Se esperaba una TuberID válida', ephemeral: true });

		const gid = interaction.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		const tuber = gcfg.tubers[tuberId];
		if(!tuber)
			return interaction.reply({ content: '⚠️ Esta TuberID ya no existe', ephemeral: true });
		
		return viewTuber(interaction, tuber, tuberId);
	})
	.setButtonResponse(async function loadPage(interaction, page) {
		return loadPageNumber(interaction, parseInt(page));
	})
	.setButtonResponse(async function filterItems(interaction, target) {
		const filter = filters[target];

		const filterInput = new TextInputBuilder()
			.setCustomId('filterInput')
			.setLabel(filter.label)
			.setPlaceholder(filter.placeholder)
			.setStyle(TextInputStyle.Short)
			.setMaxLength(48)
			.setRequired(true);
		const row = makeTextInputRowBuilder().addComponents(filterInput);
		const modal = new ModalBuilder()
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
					content: '⚠️ Usuario no encontrado',
					ephemeral: true
				});
			filter = userId;
		} else
			filter = filter.toLowerCase();
		const content = `${filters[target].label}: ${filter}`;
		return loadPageNumber(interaction, 0, content);
	})
	.setButtonResponse(async function filterClear(interaction) {
		if(!interaction.message.content)
			return interaction.reply({
				content: '⚠️ Esta lista ya muestra todos los resultados',
				ephemeral: true,
			});
			
		return loadPageNumber(interaction, 0, '');
	})
	.setButtonResponse(function getDesc(interaction, tuberId, userId) {
		userId = decompressId(userId);

		if(isNotModerator(interaction.member) && userId !== interaction.user.id) {
			const members = interaction.guild.members;
			return interaction.reply({
				content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${(members.cache.get(userId) ?? members.me).user.username}*`,
				ephemeral: true,
			});
		}

		const descInput = new TextInputBuilder()
			.setCustomId('descInput')
			.setLabel('Descripción')
			.setStyle(TextInputStyle.Paragraph)
			.setMaxLength(512);
		const row = makeTextInputRowBuilder().addComponents(descInput);
		const modal = new ModalBuilder()
			.setCustomId(`t_setDesc_${tuberId}`)
			.setTitle('Describir Tubérculo')
			.setComponents(row);

		return interaction.showModal(modal);
	})
	.setButtonResponse(async function gID(interaction, tuberId, userId) {
		userId = decompressId(userId);
		
		if(isNotModerator(interaction.member) && userId !== interaction.user.id) {
			const gcfg = await GuildConfig.findOne({ guildId: interaction.guildId });
			return interaction.reply({
				content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${(interaction.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? interaction.guild.members.me).user.username}*`,
				ephemeral: true,
			});
		}

		const nameInput = new TextInputBuilder()
			.setCustomId('nameInput')
			.setLabel('Entrada')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setPlaceholder('Nombre de la entrada');
		const descInput = new TextInputBuilder()
			.setCustomId('descInput')
			.setLabel('Descripción')
			.setStyle(TextInputStyle.Paragraph)
			.setMaxLength(512);
		const nameRow = makeTextInputRowBuilder().addComponents(nameInput);
		const descRow = makeTextInputRowBuilder().addComponents(descInput);
		const modal = new ModalBuilder()
			.setCustomId(`t_setIDesc_${tuberId}`)
			.setTitle('Describir Entrada')
			.setComponents(nameRow, descRow);

		return interaction.showModal(modal);
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		return loadPageNumber(interaction, parseInt(interaction.values[0]));
	})
	.setModalResponse(async function setDesc(interaction, tuberId) {
		if(!tuberId)
			return interaction.reply({ content: '⚠️ Se esperaba una TuberID válida', ephemeral: true });
		
		await interaction.deferReply({ ephemeral: true });

		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		if(!gcfg)
			return interaction.editReply({ content: '⚠️ Este servidor no está registrado en la base de datos' });

		if(!gcfg.tubers[tuberId])
			return interaction.editReply({ content: '⚠️ Esta TuberID ya no existe' });

		const desc = interaction.fields.getTextInputValue('descInput');
		gcfg.tubers[tuberId].desc = desc;
		gcfg.markModified(`tubers.${tuberId}`);
		await gcfg.save();

		return interaction.editReply({ content: '✅ Descripción actualizada' });
	})
	.setModalResponse(async function setIDesc(interaction, tuberId) {
		if(!tuberId)
			return interaction.reply({ content: '⚠️ Se esperaba una TuberID válida', ephemeral: true });
		
		await interaction.deferReply({ ephemeral: true });

		const gcfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
		if(!gcfg)
			return interaction.editReply({ content: '⚠️ Este servidor no está registrado en la base de datos' });

		if(!Array.isArray(gcfg.tubers[tuberId]?.inputs))
			return interaction.editReply({ content: '⚠️ Esta TuberID ya no existe, o no contiene entradas válidas' });
		
		const name = interaction.fields.getTextInputValue('nameInput');
		const inputIndex = gcfg.tubers[tuberId].inputs.findIndex(input => (input.identifier ?? input.name) === name);
		if(inputIndex < 0)
			return interaction.editReply({ content: `⚠️ La entrada "${shortenText(name, 128)}" no existe para el Tubérculo **${shortenText(tuberId, 256)}**` });

		const desc = interaction.fields.getTextInputValue('descInput');
		gcfg.tubers[tuberId].inputs[inputIndex].desc = desc;
		console.log(tuberId, name, inputIndex, ':', desc);
		gcfg.markModified(`tubers.${tuberId}`);
		await gcfg.save();

		return interaction.editReply({ content: `✅ Descripción de entrada "${shortenText(name, 256)}" actualizada` });
	});

module.exports = command;