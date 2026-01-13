const { ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SectionBuilder, SeparatorBuilder, EmbedBuilder, ActionRowBuilder, SeparatorSpacingSize, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { tenshiColor } = require('../../data/config.json');
const serverIds = require('../../data/serverIds.json');
const userIds = require('../../data/userIds.json');
const { commandFilenames } = require('../../commands/Commons/');
const { p_pure } = require('../../utils/prefixes');
const { isNotModerator, edlDistance, toCapitalized, compressId } = require('../../func');
const { client } = require('../../core/client');
const { makeStringSelectMenuRowBuilder, makeMessageActionRowBuilder } = require('../../utils/tsCasts');

/**
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest | import('discord.js').StringSelectMenuInteraction<'cached'>} request
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
	
	request.user.id === userIds.papita && categoriesMenu.addOptions(
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

	request.guildId === serverIds.saki && categoriesMenu.addOptions(new StringSelectMenuOptionBuilder()
		.setValue('SAKI')
		.setEmoji('1108197083334316183')
		.setLabel('Saki Scans')
		.setDescription('Comandos exclusivos para Saki Scans.')
		.setDefault(getDefault('SAKI')));
	
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

/**@param {import('../../commands/Commons/typings').ComplexCommandRequest | import('discord.js').MessageComponentInteraction<'cached'>} request*/
const makeGuideMenu = (request) => new StringSelectMenuBuilder()
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
	);

/**@param {import('../../commands/Commons/typings').ComplexCommandRequest | import('discord.js').MessageComponentInteraction<'cached'>} request*/
const makeGuideRow = (request) => makeStringSelectMenuRowBuilder().addComponents(makeGuideMenu(request));

/**
 * Devuelve un {@linkcode Command} según el `nameOrAlias` indicado.
 * 
 * Si no se encuentran resultados, se devuelve `null`
 * @param {import('../../commands/Commons/typings').AnyRequest} request 
 * @param {String} nameOrAlias 
 */
function searchCommand(request, nameOrAlias) {
	for(const filename of commandFilenames) {
		const commandFile = require(`../../commands/Instances/${filename}`);
		const command = /**@type {import('../../commands/Commons/').Command}*/(commandFile.command ?? commandFile);

		if(command.name !== nameOrAlias
		&& !command.aliases.some(alias => alias === nameOrAlias))
			continue;
		
		if((command.tags.has('PAPA') && request.user.id !== userIds.papita)
		|| (command.tags.has('MOD') && isNotModerator(request.member))
		|| (command.tags.has('SAKI') && request.guild.id !== serverIds.saki))
			continue;
		
		return command;
	}

	return null;
}

/**
 * Devuelve un arreglo de objetos según la `query` proporcionada.
 * 
 * Los objetos devueltos contienen un {@linkcode Command} y la distancia Damerau-Levenshtein con peso euclideano respecto a la `query`.
 * Si no se encuentran resultados, se devuelve `null`
 * @param {import('../../commands/Commons/typings').AnyRequest} request 
 * @param {String} query 
 */
function searchCommands(request, query) {
	const commands = [];
	const nameBias = 0.334;

	for(const filename of commandFilenames) {
		const commandFile = require(`../../commands/Instances/${filename}`);
		const command = /**@type {import('../../commands/Commons/').Command}*/(commandFile.command ?? commandFile);

		if(command.tags.any('GUIDE', 'MAINTENANCE', 'OUTDATED'))
			continue;

		let distance = edlDistance(command.name, query);
		if(distance > 3) {
			distance = command.aliases
				.map(alias => edlDistance(alias, query))
				.reduce((a, b) => a < b ? a : b, 999) + nameBias;
			
			if(distance > 3)
				continue;
		}
		
		if((command.tags.has('PAPA') && request.user.id !== userIds.papita)
		|| (command.tags.has('MOD') && isNotModerator(request.member))
		|| (command.tags.has('SAKI') && request.guild.id !== serverIds.saki))
			continue;
		
		commands.push({
			command,
			distance,
		});
	}

	return commands;
}

/**
 * Representa un objeto de carga útil para inyectar en una página de wiki de comando.
 * @typedef {Object} WikiPageInjectionPayload
 * @property {Array<EmbedBuilder>} embeds 
 * @property {Array<ActionRowBuilder<import('discord.js').AnyComponentBuilder>>} components 
 */

/**
 * Representa un objeto de carga útil para inyectar en una página de wiki de comando.
 * @typedef {Array<import('types').MessageComponentDataResolvable>} WikiPageInjectionPayloadV2
 */

/**@satisfies {Record<import('../../commands/Commons/cmdTags').CommandTagStringField, string>}*/
const displayTagMappings = /**@type {const}*/({
	GUIDE       : 'Página de Guía',
	MOD         : 'Mod',
	PAPA        : 'Papita con Puré',
	MAINTENANCE : 'Mantenimiento',
	OUTDATED    : 'Obsoleto',
	SAKI        : 'Saki Scans',
	CHAOS       : 'Caos',
	COMMON      : 'Común',
	EMOTE       : 'Emote',
	GAME        : 'Juego',
	MEME        : 'Meme',
	MUSIC       : 'Música',
});

/**
 * Añade embeds y componentes de una wiki de comando a la carga indicada.
 * @param {import('../../commands/Commons/').Command} command
 * @param {string} guildId 
 * @param {WikiPageInjectionPayload} payload
 */
function injectWikiPage(command, guildId, payload) {
	const { name, aliases, flags } = command;
	const { embeds, components } = payload;

	const title = (/**@type {String}*/ commandName) => {
		const pfi = commandName.indexOf('-') + 1;
		commandName = (flags.has('GUIDE')) ? `${commandName.slice(pfi)} (Página de Guía)`  : commandName;
		commandName = (flags.has('MOD'))   ? `${commandName} (Mod)`                        : commandName;
		commandName = (flags.has('PAPA'))  ? `${commandName.slice(pfi)} (Papita con Puré)` : commandName;
		return `${commandName[0].toUpperCase()}${commandName.slice(1)}`;
	};
	const isNotGuidePage = !(flags.has('GUIDE'));
	const listExists = (/**@type {Array<String>}*/ l) => l?.[0]?.length;

	//Embed de metadatos
	embeds.push(new EmbedBuilder()
		.setColor(tenshiColor)
		.setAuthor({ name: title(name), iconURL: client.user.avatarURL({ extension: 'png', size: 512 }) })
		.addFields(
			{ name: 'Nombre', value: `\`${name}\``, inline: true },
			{
				name: 'Alias',
				value: listExists(aliases)
					? (aliases.map(i => `\`${i}\``).join(', '))
					: ':label: Sin alias',
				inline: true,
			},
			{ name: 'Etiquetas', value: flags.keys.map(f => `\`${f}\``).join(', '), inline: true },
		));
	
	//Embed de información
	const infoEmbed = new EmbedBuilder()
		.setColor(0xbf94e4)
		.addFields({
			name: 'Descripción',
			value: command.desc || '⚠️ Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde',
		});

	embeds.push(infoEmbed);

	if(isNotGuidePage)
		infoEmbed.addFields(
			{ name: 'Uso (plantilla)', value: `\`${p_pure(guildId).raw}${command.name}${command.callx ? ` ${command.callx}` : ''}\`` },
			{ name: 'Opciones', value: command.options?.display || ':abacus: Sin opciones' },
		);

	components.push(new ActionRowBuilder()
		.addComponents([
			new ButtonBuilder()
				.setCustomId('ayuda_porfavorayuden')
				.setLabel('Muéstrame cómo')
				.setStyle(ButtonStyle.Primary)
				.setEmoji('📖')
				.setDisabled(true),
		]),
	);
}

/**
 * Añade embeds y componentes de una wiki de comando a la carga indicada (utiliza Componentes V2)
 * @param {import('../../commands/Commons/').Command} command
 * @param {import('../../commands/Commons/typings').ComplexCommandRequest} request 
 * @returns {WikiPageInjectionPayloadV2}
 */
function getWikiPageComponentsV2(command, request) {
	const { name: commandName, aliases, flags: commandTags } = command;

	const components = /**@type {WikiPageInjectionPayloadV2}*/([]);

	const getDisplayFlags = () =>  `${commandTags.keys.map(t => displayTagMappings[t]).join(', ')}`;
	const isNotGuidePage = !(commandTags.has('GUIDE'));
	const listExists = (/**@type {Array<String>}*/ l) => l?.[0]?.length;
	
	//Contenedor de metadatos
	const titleTextBuilder = new TextDisplayBuilder().setContent(
		isNotGuidePage
			? `# <:command:1369424059871395950> ${toCapitalized(commandName)}`
			: `# <:guide:1369552945309290647> ${toCapitalized(commandName.slice(2))}`
	);
	const taglineTextBuilder = new TextDisplayBuilder().setContent(
		isNotGuidePage
			? `-# Comando • ${getDisplayFlags()}`
			: `-# ${getDisplayFlags()}`
	);

	const namesHeaderTextBuilder = new TextDisplayBuilder().setContent('### Nombres');
	const namesContent = `\`${commandName}\`, ${listExists(aliases) ? (aliases.map(i => `\`${i}\``).join(', ')) : ''}`;
	const namesTextBuilder = new TextDisplayBuilder().setContent(namesContent);

	const metadataContainerBuilder = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(titleTextBuilder, taglineTextBuilder)
		.addSeparatorComponents(new SeparatorBuilder())
		.addTextDisplayComponents(namesHeaderTextBuilder, namesTextBuilder);

	components.push(metadataContainerBuilder);

	//Contenedor de información
	const descriptionHeaderTextBuilder = new TextDisplayBuilder().setContent(isNotGuidePage ? '### Descripción' : '### Explicación');
	const descriptionTextBuilder = new TextDisplayBuilder().setContent(command.desc || '⚠️ Este comando no tiene descripción por el momento. Inténtalo nuevamente más tarde');
	
	const wikiRows = command.wiki.rows.map(row => makeMessageActionRowBuilder()
		.addComponents(row.map(componentEvaluator => componentEvaluator(request)))
	);
	const infoContainerBuilder = new ContainerBuilder()
		.setAccentColor(0xbf94e4)
		.addTextDisplayComponents(descriptionHeaderTextBuilder, descriptionTextBuilder)
		.addActionRowComponents(wikiRows);

	components.push(infoContainerBuilder);

	if(isNotGuidePage) {
		const showMeHowButton = new ButtonBuilder()
			.setCustomId('ayuda_porfavorayuden')
			.setLabel('Probar')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true);

	 	const usageHeaderTextBuilder = new TextDisplayBuilder().setContent('### Uso (plantilla)');
	 	const usageTextBuilder = new TextDisplayBuilder().setContent(`\`\`\`bnf\n${p_pure(request).raw}${commandName}${command.callx ? ` ${command.callx}` : ''}\n\`\`\``);
	 	const usageSectionBuilder = new SectionBuilder()
	 		.addTextDisplayComponents(usageHeaderTextBuilder, usageTextBuilder)
	 		.setButtonAccessory(showMeHowButton);

	 	infoContainerBuilder
			.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
			.addSectionComponents(usageSectionBuilder)
			.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));

		if(command.options?.display) {
			const composeButton = new ButtonBuilder()
				.setCustomId('ayuda_compose')
				.setLabel('Componer...')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);
	
			 const optionsHeaderTextBuilder = new TextDisplayBuilder().setContent('### Opciones');
			 const optionsTextBuilder = new TextDisplayBuilder().setContent(command.options?.display);
			 const optionsSectionBuilder = new SectionBuilder()
				.addTextDisplayComponents(optionsHeaderTextBuilder, optionsTextBuilder)
				.setButtonAccessory(composeButton);
				
			infoContainerBuilder
				.addSectionComponents(optionsSectionBuilder);
		} else {
			const optionsTextBuilder = new TextDisplayBuilder().setContent(':abacus: _Sin opciones._');
			infoContainerBuilder
				.addTextDisplayComponents(optionsTextBuilder);
		}
	}

	return components;
}

module.exports = {
	makeCategoriesRow,
	makeGuideMenu,
	makeGuideRow,
	searchCommand,
	searchCommands,
	injectWikiPage,
	getWikiPageComponentsV2,
};
