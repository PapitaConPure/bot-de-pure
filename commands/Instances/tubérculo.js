const { default: axios } = require('axios');
const { psDocsButton, psEditorButton } = require('./purescript.js');
const GuildConfig = require('../../models/guildconfigs.js');
const { CommandOptions, CommandTags, Command, CommandOptionSolver, CommandParam } = require('../Commons/commands.js');
const { p_pure } = require('../../utils/prefixes.js');
const { isNotModerator, fetchUserID, navigationRows, edlDistance, shortenText, compressId, decompressId, warn } = require('../../func.js');
const { EmbedBuilder, ButtonBuilder, TextInputBuilder, ButtonStyle, TextInputStyle, Colors, ModalBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { RuntimeToLanguageType } = require('../../systems/ps/v1.0/commons.js');
const { executeTuber: executeTuberPS1 } = require('../../systems/ps/v1.0/purescript.js');
const { executeTuber: executeTuberPS2, CURRENT_PS_VERSION } = require('../../systems/ps/common/executeTuber.js');
const { makeButtonRowBuilder, makeTextInputRowBuilder } = require('../../utils/tsCasts.js');
const { ValueKindTranslationLookups } = require('../../systems/ps/v1.1/interpreter/values.js');
const { Input } = require('../../systems/ps/v1.1/interpreter/inputReader.js');
const { getWikiPageComponentsV2 } = require('../../systems/others/wiki.js');
const { Translator } = require('../../i18n');
const { fetchGuildMembers } = require('../../utils/guildratekeeper.js');

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
	/**@type {Array<import('discord.js').ActionRowBuilder<ButtonBuilder> | import('discord.js').ActionRowBuilder<import('discord.js').StringSelectMenuBuilder>>}*/
	const rows = [];

	if(navigationEnabled)
		rows.push(...navigationRows('tubérculo', page, lastPage));

	rows.push(
		makeButtonRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('tubérculo_filterItems_AUTHOR')
				.setLabel('Filtrar Autor')
				.setEmoji('1355133341984100483')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('tubérculo_filterItems_TID')
				.setLabel('Filtrar TuberID')
				.setEmoji('1355133341984100483')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('tubérculo_filterClear')
				.setLabel('Mostrar todo')
				.setEmoji('1355143793577426962')
				.setStyle(ButtonStyle.Danger),
		),
	);
	return rows;
}
const helpRows = () => [
	makeButtonRowBuilder().addComponents(psEditorButton, psDocsButton)
];

/**
 * @param {import('discord.js').Guild} guild 
 * @param {String} [content] 
 */
async function getItemsList(guild, content = undefined) {
	const gcfg = await GuildConfig.findOne({ guildId: guild.id }) || new GuildConfig({ guildId: guild.id });
	let items = Object.entries(gcfg.tubers).reverse();
	if(content) {
		const filter = content.split(': ');
		const [ target, value ] = filter;
		if(target === 'Autor')
			items = items.filter(([    , tuber ]) => tuber.author === value);
		else
			items = items.filter(([ tid,       ]) => tid.toLowerCase().indexOf(value) !== -1);
	}

	const lastPage = Math.ceil(items.length / pageMax) - 1;
	
	return { items, lastPage };
}

/**
 * @param {import('discord.js').ButtonInteraction | import('discord.js').SelectMenuInteraction | import('discord.js').ModalSubmitInteraction} interaction 
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

const helpString = (/**@type {import('../Commons/typings.js').ComplexCommandRequest}*/ request) => [
	'## Ejemplos de Uso',
	'Supongamos que queremos crear, ver o editar un Tubérculo llamado **"saludo"**:',
	'* 🔍 **Ver Tubérculo** — `p!t --ver saludo` o `p!t -v saludo`',
	'* 🗑️ **Borrar Tubérculo** — `p!t --borrar saludo` o `p!t -b saludo`',
	'* ✏️ **Crear o editar Tubérculo simple** — `p!t --crear saludo ¡Hola!` o `p!t -c saludo ¡Hola!`',
	`-# Usa \`${p_pure(request.guildId).raw}ayuda tubérculo\` para más información. Si quieres crear un Tubérculo avanzado, puedes leer la [documentación más reciente de PuréScript](https://papitaconpure.github.io/ps-docs/read/purescript1.10.pdf) (**v${CURRENT_PS_VERSION}**).`,
].join('\n');

const options = new CommandOptions()
	.addOptions(
		new CommandParam('id', 'TEXT')
			.setDesc('para especificar sobre qué Tubérculo operar')
			.setOptional(true)
			.setAutocomplete(async (interaction, query) => {
				if(!query) return;

				const gcfg = await GuildConfig.findOne({ guildId: interaction.guildId });
				if(!gcfg) return;

				const tubers = /**@type {{ [K: String]: import('../../systems/ps/v1.1/index.js').Tubercle }}*/(gcfg.tubers);
				const tubersArr = Object.entries(tubers)
					.map(([ name, tuber ]) => /**@type {const}*/([ name, tuber, edlDistance(name, query) ]))
					.filter(([ , , distance ]) => distance < 8);
				const existingTuber = tubersArr.find(([ id ]) => id === query);

				const membersCache = interaction.guild.members.cache;
				const clientDisplayName = interaction.guild.members.me.displayName;

				/**@type {Array<import('discord.js').ApplicationCommandOptionChoiceData>}*/
				const options = tubersArr
					.sort(([ ,, aDistance ], [ ,, bDistance ]) => aDistance - bDistance)
					.slice(0, +!!existingTuber + 24)
					.map(([ name, tuber ]) => {
						const value = name;
						
						name = `${name} - 👤 ${membersCache.get(tuber.author)?.displayName ?? clientDisplayName}`;
						
						if(tuber.advanced)
							name = `【📜】${name} - 🧩 ${tuber.inputs?.length}`;
						else
							name = `【🥔】${name}`;

						name = shortenText(name, 100);

						return { name, value };
					});

				if(!existingTuber)
					options.unshift({
						name: `【✨】${query}`,
						value: query,
					});

				return interaction.respond(options);
			}),
	)
	.addParam('mensaje',  'TEXT', 'para especificar el texto del mensaje',                { optional: true })
	.addParam('archivos', 'FILE', 'para especificar los archivos del mensaje',            { optional: true, poly: 'MULTIPLE', polymax: 8 })
	.addParam('entradas', 'TEXT', 'para especificar las entradas del Tubérculo avanzado', { optional: true, poly: 'MULTIPLE', polymax: 8 })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag('v', 		'ver', 		  				  'para ver detalles de un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo')
	.addFlag('s', 		['script','puré','pure'], 	  'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`');

const flags = new CommandTags().add('COMMON');

const command = new Command('tubérculo', flags)
	.setAliases('tuberculo', 'tubercle', 'tuber', 't')
	.setBriefDescription('Permite crear, editar, listar, borrar o ejecutar comandos personalizados de servidor')
	.setLongDescription(
		'Ofrece acciones de Tubérculos (comandos personalizados de servidor).',
		'Usar el comando sin nada lista todos los Tubérculos de este servidor',
		'Para `--crear` (o *editar*) un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya existe, será *editada*',
		'Para `--borrar` un Tubérculo, igualmente debes indicar su `<id>`',
		'Escribe los indicadores `--crear --script` (o `-cs`) para crear un **Tubérculo avanzado con PuréScript**'
	)
	.addWikiRow(
		new ButtonBuilder()
			.setURL('https://papitaconpure.github.io/ps/')
			.setLabel(`Abrir editor de PuréScript (v${CURRENT_PS_VERSION})`)
			.setEmoji('1309359188929151098')
			.setStyle(ButtonStyle.Link),
		new ButtonBuilder()
			.setURL('https://papitaconpure.github.io/ps-docs/')
			.setLabel(`Aprende PuréScript`)
			.setEmoji('📖')
			.setStyle(ButtonStyle.Link),
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const operation = args.flagIf('crear', 'crear')
			|| args.flagIf('ver', 'ver')
			|| args.flagIf('borrar', 'borrar');

		const isPureScript = args.hasFlag('script');
		const tuberId = args.getString('id');
		const members = request.guild.members.cache;

		if(operation == null && tuberId == null) {
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

		if(tuberId == null) {
			return request.reply({
				content: warn(`Debes indicar una TuberID válida para realizar una acción\n${helpString(request)}`)
			});
		}

		//Realizar operación sobre ID de Tubérculo
		const gid = request.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		gcfg.tubers ||= {};

		switch(operation) {
		case 'crear':
			if(tuberId === '```arm')
				return request.reply({ content: '¡No olvides indicar una TuberID al crear un Tubérculo!' });
			await createTuber(tuberId, gcfg, isPureScript, request, args);
			break;
		case 'ver':
			await viewTuber(request, gcfg.tubers[tuberId], tuberId, 0);
			break;
		case 'borrar':
			await deleteTuber(tuberId, gcfg, request);
			break;
		default:
			await opExecuteTuber(tuberId, gcfg, isPureScript, request, args);
			break;
		}

		return gcfg.save(); //Guardar en Configuraciones de Servidor si se cambió algo
	})
	.setButtonResponse(async function getHelp(interaction, userId) {
		const translator = await Translator.from(interaction.user);

		if(interaction.user.id !== userId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
		
		const components = getWikiPageComponentsV2(command, Command.requestize(interaction));
		
		return interaction.reply({ flags: MessageFlags.IsComponentsV2, components });
	})
	.setButtonResponse(async function getTuberHelp(interaction, tuberId, variant, updateMessage) {
		if(!tuberId)
			return interaction.reply({ content: '⚠️ Se esperaba una TuberID válida', ephemeral: true });

		const gid = interaction.guild.id;
		const guildquery = { guildId: gid };
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		const tuber = gcfg.tubers[tuberId];
		if(!tuber)
			return interaction.reply({ content: '⚠️ Esta TuberID ya no existe', ephemeral: true });
		
		return viewTuber(interaction, tuber, tuberId, +variant, updateMessage);
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
			const userId = await fetchUserID(filter, { guild, client });
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

		if(isNotModerator(interaction.member) && gcfg.tubers[tuberId].author !== interaction.user.id) {
			const member = interaction.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? interaction.guild.members.me;
			return interaction.reply({ content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${member.user.username}*` });
		}

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

		if(isNotModerator(interaction.member) && gcfg.tubers[tuberId].author !== interaction.user.id) {
			const member = interaction.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? interaction.guild.members.me;
			return interaction.reply({ content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${member.user.username}*` });
		}
		
		const name = interaction.fields.getTextInputValue('nameInput');
		const desc = interaction.fields.getTextInputValue('descInput');

		if(gcfg.tubers[tuberId].psVersion == null) {
			const inputIndex = gcfg.tubers[tuberId].inputs.findIndex(input => (input.identifier ?? input.name) === name);
			if(inputIndex < 0)
				return interaction.editReply({ content: `⚠️ La entrada "${shortenText(name, 128)}" no existe para el Tubérculo **${shortenText(tuberId, 256)}**` });
			
			gcfg.tubers[tuberId].inputs[inputIndex].desc = desc;
		} else {
			const variants = /**@type {Array<Array<*>>}*/(gcfg.tubers[tuberId].inputs);
			let found = false;
			variants.forEach((variant, variantIndex) => variant.forEach((input, inputIndex) => {
				if(Input.from(input).name === name) {
					gcfg.tubers[tuberId].inputs[variantIndex][inputIndex].desc = desc;
					found = true;
				}
			}));

			if(!found)
				return interaction.editReply({ content: `⚠️ El nombre de Entrada \`${shortenText(name, 128)}\` no existe en ninguna variante del Tubérculo **${shortenText(tuberId, 256)}**` });
		}
		
		gcfg.markModified(`tubers.${tuberId}`);
		await gcfg.save();

		return interaction.editReply({ content: `✅ Descripción de Entrada \`${shortenText(name, 256)}\` actualizada` });
	});

/**
 * 
 * @param {String} tuberId 
 * @param {import('../../models/guildconfigs.js').GuildConfigDocument} gcfg 
 * @param {Boolean} isPureScript 
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request 
 * @param {CommandOptionSolver} args 
 */	
async function createTuber(tuberId, gcfg, isPureScript, request, args) {
	if(tuberId.length > 24)
		return request.reply({ content: '⚠️️ Las TuberID solo pueden medir hasta 24 caracteres' });
	if(gcfg.tubers[tuberId] && isNotModerator(request.member) && gcfg.tubers[tuberId].author !== request.user.id)
		return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? request.guild.members.me).user.username}*` });
	
	const tuberContent = {
		author: request.userId,
		advanced: isPureScript,
	};
	const codeTag = args.isInteractionSolver() ? 0 : args.rawArgs.match(/```[A-Za-z0-9]*/)?.[0];
	const mfiles = CommandOptionSolver.asAttachments(args.parsePolyParamSync('archivos')).filter(att => att);
	const contentResult = await (async () => {
		const hasCodeImport = mfiles[0]?.name.toLowerCase().endsWith('.tuber');
		const importCode = async () => {
			const response = await axios.get(mfiles[0].url);

			if(response.status !== 200)
				return {
					error: response.statusText,
					result: /**@type {null}*/(null),
				};
			
			return {
				error: /**@type {null}*/(null),
				result: /**@type {string}*/(response.data),
			};
		}

		if(args.isInteractionSolver()) {
			if(isPureScript && hasCodeImport)
				return importCode();

			return {
				error: /**@type {null}*/(null),
				result: args.getString('mensaje'),
			};
		}

		if(!isPureScript)
			return {
				error: /**@type {null}*/(null),
				result: args.remainder.split(/[\n ]*##[\n ]*/).join('\n'),
			};

		if(hasCodeImport)
			return importCode();

		if(!codeTag)
			return {
				error: [
					'Debes poner **\\`\\`\\`** antes y después del código.',
					'Esto hará que Discord le ponga el formato adecuado al código y que sea más fácil programar.',
					'Opcionalmente, puedes poner **\\`\\`\\`arm** en el del principio para colorear el código',
				].join('\n'),
				result: /**@type {null}*/(null),
			};

		const firstIndex = args.rawArgs.indexOf(codeTag);
		const lastIndex = args.rawArgs.lastIndexOf('```');
		return {
			error: /**@type {null}*/(null),
			result: args.rawArgs.slice(firstIndex + codeTag.length, lastIndex > firstIndex ? lastIndex : args.rawArgs.length).trim(),
		};
	})();

	if(contentResult.error != null)
		return request.reply({ content: contentResult.error });

	const mcontent = contentResult.result;

	//Incluir Tubérculo; crear colección de Tubérculos si es necesario
	if(isPureScript) {
		if(!mcontent)
			return request.reply({ content: `⚠️️ Este Tubérculo requiere ingresar PuréScript\n${helpString(request)}` });
		tuberContent.script = mcontent.replace(/```[A-Za-z0-9]*/, '');
		console.log({ script: tuberContent.script });
	} else {
		if(!mcontent && !mfiles.length)
			return request.reply({ content: `⚠️️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpString(request)}` });
		if(mcontent) tuberContent.content = mcontent;
		if(mfiles.length) tuberContent.files = mfiles;
	}

	gcfg.tubers[tuberId] = tuberContent;
	
	try {
		console.log('Ejecutando PuréScript:', gcfg.tubers[tuberId]);

		gcfg.tubers[tuberId].id = tuberId;
		gcfg.tubers[tuberId].advanced = tuberContent.advanced;
		if(tuberContent.advanced)
			gcfg.tubers[tuberId].psVersion = CURRENT_PS_VERSION;

		await request.deferReply();
		await fetchGuildMembers(request.guild);
		await executeTuberPS2(request, gcfg.tubers[tuberId], { isTestDrive: true });

		if(tuberContent.advanced) {
			// eslint-disable-next-line no-self-assign
			gcfg.tubers[tuberId].script = gcfg.tubers[tuberId].script;
			gcfg.tubers[tuberId].inputs = gcfg.tubers[tuberId].inputs
				.map(variant => variant.map(input => input.json));
			// eslint-disable-next-line no-self-assign
			gcfg.tubers[tuberId].saved = gcfg.tubers[tuberId].saved;
		}

		console.log('PuréScript ejecutado:', gcfg.tubers[tuberId]);
		gcfg.markModified(`tubers`);
	} catch(error) {
		console.log('Ocurrió un error al añadir un nuevo Tubérculo');
		console.error(error);
		const errorContent = { content: '❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará' };
		return request.editReply(errorContent);
	}
}

/**
 * 
 * @param {import('../Commons/typings.js').ComplexCommandRequest | import('discord.js').ButtonInteraction<'cached'>} interaction 
 * @param {*} item 
 * @param {String} tuberId 
 * @param {Number} inputVariant 
 * @param {*} updateMessage 
 */
function viewTuber(interaction, item, tuberId, inputVariant, updateMessage) {
	if(!item)
		return interaction.reply({ content: `⚠️️ El Tubérculo **${tuberId}** no existe` });

	const author = interaction.guild.members.cache.get(item.author) ?? interaction.guild.members.me;

	const descriptionButtons = [
		new ButtonBuilder()
			.setCustomId(`t_getDesc_${tuberId}_${compressId(item.author)}`)
			.setLabel('Describir Tubérculo')
			.setEmoji('ℹ')
			.setStyle(ButtonStyle.Primary),
	];
	const variantButtons = [];
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

	if(item.psVersion)
		embed.addFields({
			name: 'Versión',
			value: `\`PS v${item.psVersion}\``,
			inline: true,
		});
	
	if(item.desc)
		embed.addFields({
			name: 'Descripción',
			value: item.desc ?? '*Este Tubérculo no tiene descripción*',
		});
	
	if(item.script) {
		const pageCount = item.inputs.length;

		if(item.inputs?.length) {
			let inputTitle;
			let inputStrings;
			let actuallyValid = true;
			
			if(!item.psVersion) {
				inputTitle = 'Entradas';
				inputStrings = item.inputs
					.map(i => `**(${RuntimeToLanguageType.get(i.type) ?? ValueKindTranslationLookups.get(i.kind) ?? 'Nada'})** \`${i.name ?? 'desconocido'}\`: ${i.desc ?? 'Sin descripción'}`)
					.join('\n');
			} else {
				inputTitle = `Entradas (variante ${inputVariant + 1} de ${pageCount})`;
				if(item.inputs[inputVariant].length === 0)
					actuallyValid = false;
				else
					inputStrings = item.inputs[inputVariant]
						.map(i => Input.from(i).toString())
						.join('\n');
			}

			if(actuallyValid) {
				embed.addFields({
					name: inputTitle,
					value: inputStrings,
				});
				descriptionButtons.push(
					new ButtonBuilder()
						.setCustomId(`t_gID_${tuberId}_${compressId(item.author)}`)
						.setLabel('Describir Entrada')
						.setEmoji('🏷')
						.setStyle(ButtonStyle.Success),
				);
			} else {
				embed.addFields({
					name: inputTitle,
					value: '_(Variante sin Entradas)_',
				});
			}
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

		if(item.psVersion && item.inputs.length > 1) {
			const previousPage = (inputVariant === 0) ? (pageCount - 1) : (inputVariant - 1);
			const nextPage = (inputVariant === pageCount - 1) ? 0 : (inputVariant + 1);
			variantButtons.push(
				new ButtonBuilder()
					.setCustomId(`tubérculo_getTuberHelp_${tuberId}_${previousPage}_A`)
					.setEmoji('934430008343158844')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`tubérculo_getTuberHelp_${tuberId}_${nextPage}_B`)
					.setEmoji('934430008250871818')
					.setStyle(ButtonStyle.Secondary),
				);
		}
	} else {
		if(item.content) embed.addFields({ name: 'Mensaje', value: item.content });
		if(item.files && item.files.length) embed.addFields({
			name: 'Archivos',
			value: item.files.map((f,i) => `[${i}](${f})`).join(', '),
		});
	}

	const embeds = [embed];
	const components = [ makeButtonRowBuilder().addComponents(...descriptionButtons) ]
	if(variantButtons.length > 0)
		components.push(makeButtonRowBuilder().addComponents(...variantButtons));

	return updateMessage
		? /**@type {import('discord.js').ButtonInteraction<'cached'>}*/(interaction).update({ embeds, files, components })
		: interaction.reply({ embeds, files, components });
}

/**
 * 
 * @param {String} tuberId
 * @param {import('../../models/guildconfigs.js').GuildConfigDocument} gcfg 
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request 
 */
function deleteTuber(tuberId, gcfg, request) {
	if(!gcfg.tubers[tuberId])
		return request.reply({ content: `⚠️️ El Tubérculo **${tuberId}** no existe` });

	if(isNotModerator(request.member) && gcfg.tubers[tuberId].author !== request.userId)
		return request.reply({ content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[tuberId].author) ?? request.guild.members.me).user.username}*` });

	gcfg.tubers[tuberId] = null;
	delete gcfg.tubers[tuberId];
	gcfg.markModified('tubers');
	request.reply({ content: '✅ Tubérculo eliminado con éxito' });
}

/**
 * 
 * @param {String} tuberId
 * @param {import('../../models/guildconfigs.js').GuildConfigDocument} gcfg 
 * @param {Boolean} isPureScript 
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request 
 * @param {CommandOptionSolver} args 
 */
async function opExecuteTuber(tuberId, gcfg, isPureScript, request, args) {
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
	
	const tuberArgs = CommandOptionSolver.asStrings(args.parsePolyParamSync('entradas', { regroupMethod: 'DOUBLE-QUOTES' })).filter(input => input);
	await request.deferReply();
	let executeFn;
	
	if(gcfg.tubers[tid].psVersion == null)
		executeFn = executeTuberPS1;
	else
		executeFn = executeTuberPS2;

	const savedData = gcfg.tubers[tid].saved && new Map(Object.entries(gcfg.tubers[tid].saved));
	await fetchGuildMembers(request.guild);
	await executeFn(request, gcfg.tubers[tid], { args: tuberArgs, isTestDrive: false, overwrite: false, savedData })
	.then(() => {
		// eslint-disable-next-line no-self-assign
		gcfg.tubers[tid].saved = gcfg.tubers[tid].saved;
		if(gcfg.tubers[tid].psVersion != null)
			gcfg.tubers[tid].inputs = gcfg.tubers[tid].inputs
				.map(variant => variant.map(input => input.json ?? input));
		gcfg.markModified('tubers');
	})
	.catch(error => {
		console.log('Ocurrió un error al ejecutar un Tubérculo');
		console.error(error);
		if(!gcfg.tubers[tid].script && error.name !== 'TuberInitializerError')
			request.editReply({ content: '❌ Parece que hay un problema con este Tubérculo. Si eres el creador, puedes modificarlo o eliminarlo. Si no, avísale al creador' });
	});
}

module.exports = command;
