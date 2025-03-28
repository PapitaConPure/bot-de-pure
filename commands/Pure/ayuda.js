const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, GuildMember } = require('discord.js');
const { serverid, tenshiColor, peopleid } = require('../../localdata/config.json'); //Variables globales
const { isNotModerator, compressId, decompressId, shortenText, edlDistance } = require('../../func');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { commandFilenames, CommandOptions, CommandTags, CommandManager, CommandParam } = require('../Commons/commands');
const { injectWikiPage, searchCommand, searchCommands } = require('../../wiki');
const { makeStringSelectMenuRowBuilder } = require('../../tsCasts');

/**
 * @param {import('../Commons/typings').ComplexCommandRequest | import('discord.js').StringSelectMenuInteraction<'cached'>} request
 * @param {Array<String>} selections
 */
const makeCategoriesRow = (request, selections) => {
	const getDefault = (/**@type {String}*/d) => !!selections.includes(d);

	const categoriesMenu = new StringSelectMenuBuilder()
		.setCustomId(`ayuda_viewCategory_${compressId(request.user.id)}`)
		.setPlaceholder('Categorías de Comandos...')
		.setMinValues(0)
		.setMaxValues(6)
		.addOptions(new StringSelectMenuOptionBuilder()
			.setValue('COMMON')
			.setEmoji('828736342372253697')
			.setLabel('General')
			.setDescription('Comandos comunes, de propósito general.')
			.setDefault(getDefault('COMMON')));
	
	!isNotModerator(request.member) && categoriesMenu.addOptions(new StringSelectMenuOptionBuilder()
		.setValue('MOD')
		.setEmoji('704612794921779290')
		.setLabel('Moderación')
		.setDescription('Comandos limitados a moderadores.')
		.setDefault(getDefault('MOD')));
	
	request.user.id === peopleid.papita && categoriesMenu.addOptions(
		new StringSelectMenuOptionBuilder()
			.setValue('PAPA')
			.setEmoji('797295151356969030')
			.setLabel('Papita con Puré')
			.setDescription('Comandos restringidos a Papita con Puré.')
			.setDefault(getDefault('PAPA')),
		new StringSelectMenuOptionBuilder()
			.setValue('OUTDATED')
			.setEmoji('657367372285476905')
			.setLabel('Desactualizado')
			.setDescription('Comandos en desuso, ya no pueden llamarse.')
			.setDefault(getDefault('OUTDATED')),
		new StringSelectMenuOptionBuilder()
			.setValue('MAINTENANCE')
			.setEmoji('🛠️')
			.setLabel('En mantenimiento')
			.setDescription('Comandos en desarrollo o mantenimiento.')
			.setDefault(getDefault('MAINTENANCE')),
	);

	request.guildId === serverid.saki && categoriesMenu.addOptions(new StringSelectMenuOptionBuilder()
		.setValue('HOURAI')
		.setEmoji('1108197083334316183')
		.setLabel('Saki Scans')
		.setDescription('Comandos exclusivos para Saki Scans.')
		.setDefault(getDefault('HOURAI')));
	
	categoriesMenu.addOptions(
		new StringSelectMenuOptionBuilder()
			.setValue('MUSIC')
			.setEmoji('🎵')
			.setLabel('Música')
			.setDescription('Comandos PuréMusic para reproducir música.')
			.setDefault(getDefault('MUSIC')),
		new StringSelectMenuOptionBuilder()
			.setValue('EMOTE')
			.setEmoji('704612794921779290')
			.setLabel('Emotes')
			.setDescription('Comandos de emotes. Puedes llamarlos &así.')
			.setDefault(getDefault('EMOTE')),
		new StringSelectMenuOptionBuilder()
			.setValue('MEME')
			.setEmoji('721973016455807017')
			.setLabel('Memes')
			.setDescription('Comandos de carácter memético.')
			.setDefault(getDefault('MEME')),
		new StringSelectMenuOptionBuilder()
			.setValue('GAME')
			.setEmoji('🎲')
			.setLabel('Juegos')
			.setDescription('Comandos de juego y/o fiesta.')
			.setDefault(getDefault('GAME')),
		new StringSelectMenuOptionBuilder()
			.setValue('CHAOS')
			.setEmoji('👹')
			.setLabel('Caos')
			.setDescription('Comandos caóticos. Requieren habilitarse.')
			.setDefault(getDefault('CHAOS')),
	);

	return makeStringSelectMenuRowBuilder().addComponents(categoriesMenu);
}
		
/**
 * @param {import('../Commons/typings').ComplexCommandRequest | import('discord.js').StringSelectMenuInteraction<'cached'>} request
 */
const makeGuideRow = (request) => makeStringSelectMenuRowBuilder().addComponents(
	new StringSelectMenuBuilder()
		.setCustomId(`ayuda_viewGuideWiki_${compressId(request.user.id)}`)
		.setPlaceholder('Guías...')
		.setOptions(
			new StringSelectMenuOptionBuilder()
				.setValue('index')
				.setEmoji('📚')
				.setLabel('Guía Introductoria')
				.setDescription('Pantallazo general del modo de utilización de Bot de Puré.'),
			new StringSelectMenuOptionBuilder()
				.setValue('options')
				.setEmoji('🧮')
				.setLabel('Guía de Opciones')
				.setDescription('Información acerca de las Opciones de Comando.'),
			new StringSelectMenuOptionBuilder()
				.setValue('params')
				.setEmoji('🎛️')
				.setLabel('Guía de Parámetros')
				.setDescription('Explicación detallada sobre los Parámetros de Comando.'),
			new StringSelectMenuOptionBuilder()
				.setValue('types')
				.setEmoji('❔')
				.setLabel('Guía de Tipos de Parámetro')
				.setDescription('Detalles sobre los Tipos de Parámetro u Expresiones de Bandera.'),
		),
);

/**@param {import('../Commons/typings').ComplexCommandRequest | import('discord.js').StringSelectMenuInteraction<'cached'>} request*/
const makeExcludedTags = (request) => {
	/**@type {Array<import('../Commons/cmdTags').CommandTagResolvable>}*/
	const excludedTags = [ 'GUIDE' ];

	isNotModerator(request.member) && excludedTags.push('MOD');
	request.guildId !== serverid.saki && excludedTags.push('HOURAI');
	request.user.id !== peopleid.papita && excludedTags.push('PAPA', 'MAINTENANCE', 'OUTDATED');

	return excludedTags;
};

const flags = new CommandTags().add('COMMON');

const options = new CommandOptions()
	.addOptions(
		new CommandParam('comando', 'TEXT')
			.setDesc('para ver ayuda en un comando en específico')
			.setOptional(true)
			.setAutocomplete((interaction, query) => {
				return interaction.respond(
					searchCommands(interaction, query)
						.sort(({ distance: a }, { distance: b }) => a - b)
						.slice(0, 10)
						.map(({ command }) => ({
							name: shortenText(`${command.name} - ${command.brief ?? command.desc ?? '...'}`, 100),
							value: command.name,
						})),
				);
			}),
	);

const command = new CommandManager('ayuda', flags)
	.setAliases('comandos', 'acciones', 'help', 'commands', 'h')
	.setBriefDescription('Muestra una lista de comandos o un comando en detalle')
	.setLongDescription(
		'Muestra una lista de comandos deseada o un comando en detalle',
		'Al buscar listas de comandos, se filtran los comandos que tienen al menos uno de los `--identificadores` buscados',
		'Puedes hacer una búsqueda `--exclusiva` si solo quieres los comandos que tengan **todos** los identificadores buscados',
	)
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const search = args.getString('comando');
		const guildPrefix = p_pure(request.guildId).raw;
		const helpCommand = `${guildPrefix}${command.name}`;
		
		//Análisis de comandos
		if(!search) {
			const commands = lookupCommands({
				excludedTags: makeExcludedTags(request), 
				context: request,
			});
			
			//Embed de metadatos
			const embed = new EmbedBuilder()
				.setColor(tenshiColor)
				.setAuthor({ name: 'Bot de Puré', iconURL: request.client.user.avatarURL({ extension: 'png', size: 512 }) })
				.setTitle('Centro de Ayuda')
				.addFields(
					{
						name: 'Ejemplos de uso',
						value: `${guildPrefix}avatar ${request.client.user}\n${guildPrefix}dados 5d6`,
						inline: true,
					},
					{
						name: 'Emotes rápidos',
						value: `Usa un **&comando de emote** en cualquier parte de tus mensajes`,
						inline: true,
					},
					{
						name: `Puedes usar ${helpCommand} con el nombre de alguno de estos comandos:`,
						value: commands.map(c => `\`${c.name}\``).join(', '),
					},
				);

			return request.reply({
				embeds: [ embed ],
				components: [
					makeCategoriesRow(request, []),
					makeGuideRow(request)
				],
			});
		}

		const embeds = [];
		const components = [];
		const foundCommand = searchCommand(request, search);

		if(foundCommand) {
			injectWikiPage(foundCommand, request.guildId, { embeds, components });
		} else {
			embeds.push(new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}comando <comando>\` para ver un comando en específico`,
				}));
		}
		
		components.unshift(makeGuideRow(request));

		return request.reply({ embeds, components });
	})
	.setSelectMenuResponse(async function viewCategory(interaction) {
		const guildPrefix = p_pure(interaction.guildId).raw;
		const helpCommand = `${guildPrefix}${command.name}`;

		const commands = lookupCommands({
			tags: /**@type {Array<import('../Commons/cmdTags').CommandTagResolvable>}*/(interaction.values),
			excludedTags: makeExcludedTags(interaction),
			context: interaction,
		});

		//Embed de metadatos
		const embed = new EmbedBuilder()
			.setColor(tenshiColor)
			.setAuthor({ name: 'Bot de Puré', iconURL: interaction.client.user.avatarURL({ extension: 'png', size: 512 }) })
			.setTitle('Centro de Ayuda')
			.addFields(
				{
					name: 'Ejemplos de uso',
					value: `${guildPrefix}avatar ${interaction.client.user}\n${guildPrefix}dados 5d6`,
					inline: true,
				},
				{
					name: 'Emotes rápidos',
					value: `Usa un **&comando de emote** en cualquier parte de tus mensajes`,
					inline: true,
				},
				commands.length ? {
					name: `Puedes usar ${helpCommand} con el nombre de alguno de estos comandos:`,
					value: commands.map(c => `\`${c.name}\``).join(', '),
				} : {
					name: `Demasiados filtros`,
					value: 'Ningún comando que puedas usar tiene todas las categorías que indicaste. Prueba filtrar de manera menos estricta',
				},
			);

		return interaction.update({
			embeds: [ embed ],
			components: [
				makeCategoriesRow(interaction, interaction.values),
				makeGuideRow(interaction)
			],
		});
	}, { userFilterIndex: 0 })
	.setSelectMenuResponse(async function viewGuideWiki(interaction) {
		const guildPrefix = p_pure(interaction.guildId).raw;
		const helpCommand = `${guildPrefix}${command.name}`;

		let search;
		switch(interaction.values[0]) {
		case 'index': search = 'g-indice'; break;
		case 'options': search = 'g-opciones'; break;
		case 'params': search = 'g-parametros'; break;
		case 'types': search = 'g-tipos'; break;
		default: search = ''; break;
		}

		const embeds = [];
		const components = [];
		const foundCommand = searchCommand(interaction, search);

		if(foundCommand) {
			injectWikiPage(foundCommand, interaction.guildId, { embeds, components });
		} else {
			embeds.push(new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}comando <comando>\` para ver un comando en específico`,
				}));
		}
		
		components.unshift(makeGuideRow(interaction));

		return interaction.update({ embeds, components });
	}, { userFilterIndex: 0 });

/**
 * Recupera un arreglo de {@linkcode CommandManager} según la `query` proporcionada.
 * @typedef {Object} CommandsLookupQuery
 * @property {Array<import('../Commons/cmdTags').CommandTagResolvable>} [tags]
 * @property {Array<import('../Commons/cmdTags').CommandTagResolvable>} [excludedTags]
 * @property {{ member: GuildMember, channel: import('discord.js').GuildChannelResolvable }} [context]
 * 
 * @param {CommandsLookupQuery} [query]
 */
function lookupCommands(query = {}) {
	query.tags ??= [];
	query.excludedTags ??= [];
	const { tags, excludedTags, context } = query;

	let commandIsAllowed;
	if(context)
		commandIsAllowed = (/**@type {CommandManager}*/ command) => command.permissions?.isAllowedIn(context.member, context.channel) ?? true;
	else
		commandIsAllowed = (/**@type {CommandManager}*/ command) => true;

	let commandMeetsCriteria;
	if(tags.length && excludedTags.length)
		commandMeetsCriteria = (/**@type {CommandManager}*/ command) => !excludedTags.some(tag => command.tags.has(tag)) && tags.every(tag => command.tags.has(tag));
	else if(tags.length)
		commandMeetsCriteria = (/**@type {CommandManager}*/ command) => tags.every(tag => command.tags.has(tag));
	else if(excludedTags.length)
		commandMeetsCriteria = (/**@type {CommandManager}*/ command) => !excludedTags.some(tag => command.tags.has(tag));
	else
		commandMeetsCriteria = (/**@type {CommandManager}*/ command) => true;

	/**@type {Array<CommandManager>}*/
	const commands = [];

	for(const file of commandFilenames) {
		const commandFile = require(`../../commands/Pure/${file}`);
		const command = /**@type {CommandManager}*/(commandFile.command ?? commandFile);

		if(commandIsAllowed(command) && commandMeetsCriteria(command))
			commands.push(command);
	}

	return commands;
}

module.exports = command;
