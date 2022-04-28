const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { fetchFlag, isNotModerator, fetchUserID } = require('../../func.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, MessageCollector, MessageAttachment } = require('discord.js');
const { executeTuber } = require('../../systems/purescript.js');

const options = new CommandOptionsManager()
	.addParam('id', 	  'TEXT',           'para especificar sobre qué Tubérculo operar', { optional: true })
	.addParam('mensaje',  'TEXT',           'para especificar el texto del mensaje',       { optional: true })
	.addParam('archivos', ['FILE','IMAGE'], 'para especificar los archivos del mensaje',   { optional: true, poly: 'MULTIPLE' })
	.addFlag(['c','m'], ['crear','agregar','añadir'], 'para crear o editar un Tubérculo')
	.addFlag('v', 		'ver', 		  				  'para ver detalles de un Tubérculo')
	.addFlag(['b','d'], ['borrar','eliminar'], 		  'para eliminar un Tubérculo')
	.addFlag('s', 		['script','puré','pure'], 	  'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`');

const pageMax = 10;

/**
 * Retorna un arreglo de MessageActionRows en respecto a la página actual y si la navegación por página está permitida
 * @param {Number} page 
 * @param {Number} backward 
 * @param {Number} forward 
 * @param {Number} lastPage 
 * @param {Boolean} navigationEnabled 
 * @returns {Array<MessageActionRow>}
 */
const paginationRows = (page, backward, forward, lastPage, navigationEnabled = true) => {
	let i = 0;
	const rows = [];
	if(navigationEnabled)
		rows.push(
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
		);
	rows.push(
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
	);
	return rows;
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
		const helpstr = `Usa \`${p_pure(request.guildId).raw}ayuda ${module.exports.name}\` para más información`;
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
						.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL() })
						.setTitle('Arsenal de Tubérculos del Servidor')
						.addField(
							`🥔)▬▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${items.length ? `1 / ${lastPage + 1}` : '- - -'} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬▬(🥔`, 
							items.length
								? items.splice(0, pageMax)
									.map(([tid,tuber]) => `**${tid}** • ${(members.get(tuber.author) ?? request.guild.me).user.username}`)
									.join('\n')
								: `Este servidor no tiene ningún Tubérculo.\nComienza a desplegar TuberIDs con \`${p_pure(request.guildId).raw}tubérculo --crear\``,
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
						tuberContent.script = mcontent.split(/ *;+ */).map(line => line.split(/ +/).filter(word => !word.match(/^```[A-Za-z0-9]*/))).filter(line => line.length);
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

					let files = [];
					const embed = new MessageEmbed()
					.setColor('DARK_VIVID_PINK')
					.setAuthor({ name: request.guild.name, iconURL: request.guild.iconURL() })
					.addField('Visor de Tubérculos', [
						`**TuberID** ${id}`,
						`**Autor** ${(request.guild.members.cache.get(item.author) ?? request.guild.me).user.username}`,
						`**Descripción** ${item.desc ?? '*Este Tubérculo no tiene descripción*'}`,
					].join('\n'));
					
					if(item.script) {
						embed.addField('Entradas', `\`[${(item.inputs ?? []).map(i => i.identifier).join(', ')}]\``);
						const visualPS = item.script.map(expr => expr.join(' ')).join(';\n');
						if(visualPS.length >= 1020)
							files = [new MessageAttachment(Buffer.from(visualPS, 'utf-8'), 'PuréScript.txt')];
						else
							embed.addField('PuréScript', [
								'```arm',
								`${visualPS}`,
								'```',
							].join('\n'));
					} else {
						if(item.content) embed.addField('Mensaje', item.content);
						if(item.files && item.files.length) embed.addField('Archivos', item.files.map((f,i) => `[${i}](${f})`).join(', '));
					}

					return await request.reply({
						embeds: [embed],
						files,
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
				items = items.filter(([tid,_]) => tid.toLowerCase().indexOf(value) !== -1);
		}

		const lastPage = Math.ceil(items.length / pageMax) - 1;
		const backward = (page > 0) ? (page - 1) : lastPage;
		const forward = (page < lastPage) ? (page + 1) : 0;
		console.log(backward, '<-', page, '->', forward, '//', lastPage);
		
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
					.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
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
			const paginationEnabled = items.length >= pageMax;
			await interaction.message.edit({
				content,
				embeds: [
					new MessageEmbed()
						.setColor(oembed.color)
						.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
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
				components: paginationRows(0, backward, forward, lastPage, paginationEnabled),
			});
			collected.delete().catch(console.error);
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
			const paginationEnabled = items.length >= pageMax;
			await interaction.message.edit({
				content,
				embeds: [
					new MessageEmbed()
						.setColor(oembed.color)
						.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
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
				components: paginationRows(0, backward, forward, lastPage, paginationEnabled),
			});
			collected.delete().catch(console.error);
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
			const { guild, message } = interaction;
			const members = guild.members.cache;
			const oembed = message.embeds[0];
			const { items, lastPage, backward, forward } = await module.exports.getItemsList(guild, '', 0);
			return await interaction.update({
				content: null,
				embeds: [
					new MessageEmbed()
						.setColor(oembed.color)
						.setAuthor({ name: oembed.author.name, iconURL: oembed.author.url })
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
				components: paginationRows(0, backward, forward, lastPage, items.length >= pageMax),
			});
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