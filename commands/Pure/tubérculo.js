const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { fetchFlag, isNotModerator, fetchUserID, navigationRows } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment, Modal, TextInputComponent } = require('discord.js');
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
const loadPageNumber = async(interaction, page) => {
	page = parseInt(page);
	const { guild, message } = interaction;
	const { items, lastPage } = await getItemsList(guild, message.content, page);
	const members = guild.members.cache;
	const oembed = message.embeds[0];

	return interaction.update({
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
								.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
								.join('\n')
							: `Ningún Tubérculo coincide con la búsqueda actual`,
					inline: true,
				}),
		],
		components: (items.length < pageMax) ? null : paginationRows(page, lastPage),
	});
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
		'En caso de estar creando un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya está registrada, será *reemplazada (editada)*',
		'En cualquier parte del contenido del mensaje, coloca "#FIN#" para bajar un renglón',
		'En caso de estar editando o borrando un Tubérculo existente, se requerirá su TuberID',
		'⚠️ Ten en cuenta que este comando es experimental y cualquier Tubérculo ingresado podría ser eventualmente perdido a medida que me actualizo',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash = false) => {
		//Determinar operación
		const helpString = `Usa \`${p_pure(request.guildId).raw}ayuda ${module.exports.name}\` para más información`;
		const operation = options.fetchFlag(args, 'crear', { callback: 'crear' })
			|| options.fetchFlag(args, 'ver', { callback: 'ver' })
			|| options.fetchFlag(args, 'borrar', { callback: 'borrar' });
		const ps = options.fetchFlag(args, 'script');
		console.log(ps);

		//Preparar ejecución
		const id = isSlash ? args.getString('id') : args.shift();
		const gid = request.guild.id;
		const guildquery = { guildId: gid };
		const members = request.guild.members.cache;

		if(!id) {
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
									.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? request.guild.me).user.username}`)
									.join('\n')
								: `Este servidor no tiene ningún Tubérculo.\nComienza a desplegar TuberIDs con \`${p_pure(request.guildId).raw}tubérculo --crear\``,
							inline: true,
						}),
				],
				components: (items.length < pageMax) ? null : paginationRows(0, lastPage),
			});
		}

		//Realizar operación sobre ID de Tubérculo
		const gcfg = (await GuildConfig.findOne(guildquery)) || new GuildConfig(guildquery);
		gcfg.tubers = gcfg.tubers || {};
		switch(operation) {
			case 'crear':
				if(id.length > 24)
					return request.reply({ content: '⚠️ Las TuberID solo pueden medir hasta 24 caracteres' });
				if(gcfg.tubers[id] && isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
					return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${id}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[id].author) ?? request.guild.me).user.username}*` });
				
				const tuberContent = { author: (request.user ?? request.author).id };
				const mcontent = (isSlash ? args.getString('mensaje') : args.join(' ')).split(/[\n ]*#FIN#[\n ]*/).join('\n');
				const mfiles = isSlash ? options.fetchParamPoly(args, 'archivos', args.getString, null).filter(att => att) : (request.attachments || []).map(att => att.proxyURL);

				//Incluir Tubérculo; crear colección de Tubérculos si es necesario
				if(ps) {
					if(!mcontent)
						return request.reply({ content: `⚠️ Este Tubérculo requiere ingresar PuréScript\n${helpString}` });
					tuberContent.script = mcontent.split(/ *;+ */).map(line => line.split(/ +/).filter(word => !word.match(/^```[A-Za-z0-9]*/))).filter(line => line.length);
				} else {
					if(!mcontent && !mfiles.length)
						return request.reply({ content: `⚠️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpString}` });
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
					return request.reply({ content: '❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará' });
				}
				break;

			case 'ver':
				const item = gcfg.tubers[id];
				if(!item)
					return request.reply({ content: `⚠️ El Tubérculo **${id}** no existe` });

				let files = [];
				const embed = new MessageEmbed()
				.setColor('DARK_VIVID_PINK')
				.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL() })
				.addFields({
					name: 'Visor de Tubérculos',
					value: [
						`**TuberID** ${id}`,
						`**Autor** ${(request.guild.members.cache.get(item.author) ?? request.guild.me).user.username}`,
						`**Descripción** ${item.desc ?? '*Este Tubérculo no tiene descripción*'}`,
					].join('\n')
				});
				
				if(item.script) {
					embed.addField('Entradas', `\`[${(item.inputs ?? []).map(i => i.identifier).join(', ')}]\``);
					const visualPS = item.script.map(expr => expr.join(' ')).join(';\n');
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
				if(!gcfg.tubers[id])
					return request.reply({ content: `⚠️ El Tubérculo **${id}** no existe` });
				if(isNotModerator(request.member) && gcfg.tubers[id].author !== (request.author ?? request.user).id)
					return request.reply({ content: `⛔ Acción denegada. Esta TuberID **${id}** le pertenece a *${(request.guild.members.cache.get(gcfg.tubers[id].author) ?? request.guild.me).user.username}*` });

				gcfg.tubers[id] = null;
				delete gcfg.tubers[id];
				gcfg.markModified('tubers');
				request.reply({ content: '✅ Tubérculo eliminado con éxito' });
				break;
			
			default:
				if(!gcfg.tubers[id]) return request.reply({
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
		return await gcfg.save(); //Guardar en Configuraciones de Servidor si se cambió algo
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

		return await interaction.showModal(modal);
	})
	.setModalResponse(async function filterSubmit(interaction, target) {
		const { guild, client } = interaction;
		const members = guild.members.cache;
		const oembed = interaction.message.embeds[0];
		
		let filter = interaction.fields.getTextInputValue('filterInput');
		if(target === 'AUTHOR') {
			if(filter.startsWith('@'))
				filter = filter.slice(1);
			const userId = fetchUserID(filter, { guild, client });
			if(!userId)
				return await interaction.reply({
					content: '⚠ Usuario no encontrado',
					ephemeral: true
				});
			filter = userId;
		}
		const content = `${filters[target].label}: ${filter}`;
		const { items, lastPage } = await getItemsList(guild, content);
		const paginationEnabled = items.length >= pageMax;
		await interaction.update({
			content,
			embeds: [
				new MessageEmbed()
					.setColor(oembed.color)
					.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
					.setTitle(oembed.title)
					.addFields({
						name: `🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ 1 / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
						value: items.length
							? items.splice(0, pageMax)
								.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
								.join('\n')
							: `Ningún Tubérculo coincide con la búsqueda actual`,
						inline: true,
					}),
			],
			components: paginationRows(0, lastPage, paginationEnabled),
		});
	})
	.setButtonResponse(async function filterClear(interaction) {
		if(!interaction.message.content)
			return interaction.reply({
				content: '⚠ Esta lista ya muestra todos los resultados',
				ephemeral: true,
			});
			
		const { guild } = interaction;
		const members = guild.members.cache;
		const oembed = interaction.message.embeds[0];
		const { items, lastPage } = await getItemsList(guild, '', 0);
		return interaction.update({
			content: null,
			embeds: [
				new MessageEmbed()
					.setColor(oembed.color)
					.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
					.setTitle(oembed.title)
					.addFields({
						name: `🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ 1 / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
						value: items.length
							? items.splice(0, pageMax)
								.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? guild.me).user.username}`)
								.join('\n')
							: `Ningún Tubérculo coincide con la búsqueda actual`,
						inline: true,
					}),
			],
			components: paginationRows(0, lastPage, items.length >= pageMax),
		});
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		return loadPageNumber(interaction, interaction.values[0]);
	});

module.exports = command;