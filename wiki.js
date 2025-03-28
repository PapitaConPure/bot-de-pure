const { EmbedBuilder, ButtonInteraction, StringSelectMenuInteraction, AutocompleteInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { serverid, tenshiColor, peopleid } = require('./localdata/config.json');
const { commandFilenames } = require('./commands/Commons/commands');
const { CommandManager } = require('./commands/Commons/cmdBuilder');
const { p_pure } = require('./localdata/customization/prefixes');
const { isNotModerator, edlDistance } = require('./func');
const Client = require('./client');

/**
 * Devuelve un {@linkcode CommandManager} según el `nameOrAlias` indicado.
 * 
 * Si no se encuentran resultados, se devuelve `null`
 * @param {import('./commands/Commons/typings').ComplexCommandRequest | ButtonInteraction<'cached'> | StringSelectMenuInteraction<'cached'> | AutocompleteInteraction<'cached'>} request 
 * @param {String} nameOrAlias 
 */
function searchCommand(request, nameOrAlias) {
	for(const filename of commandFilenames) {
		const commandFile = require(`./commands/Pure/${filename}`);
		const command = /**@type {CommandManager}*/(commandFile.command ?? commandFile);

		if(command.name !== nameOrAlias
		&& !command.aliases.some(alias => alias === nameOrAlias))
			continue;
		
		if((command.tags.has('PAPA') && request.user.id !== peopleid.papita)
		|| (command.tags.has('MOD') && isNotModerator(request.member))
		|| (command.tags.has('HOURAI') && request.guild.id !== serverid.saki))
			continue;
		
		return command;
	}

	return null;
}

/**
 * Devuelve un arreglo de objetos según la `query` proporcionada.
 * 
 * Los objetos devueltos contienen un {@linkcode CommandManager} y la distancia Damerau-Levenshtein con peso euclideano respecto a la `query`.
 * Si no se encuentran resultados, se devuelve `null`
 * @param {import('./commands/Commons/typings').ComplexCommandRequest | ButtonInteraction<'cached'> | StringSelectMenuInteraction<'cached'> | AutocompleteInteraction<'cached'>} request 
 * @param {String} query 
 */
function searchCommands(request, query) {
	const commands = [];
	const nameBias = 0.334;

	for(const filename of commandFilenames) {
		const commandFile = require(`./commands/Pure/${filename}`);
		const command = /**@type {CommandManager}*/(commandFile.command ?? commandFile);

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
		
		if((command.tags.has('PAPA') && request.user.id !== peopleid.papita)
		|| (command.tags.has('MOD') && isNotModerator(request.member))
		|| (command.tags.has('HOURAI') && request.guild.id !== serverid.saki))
			continue;
		
		commands.push({
			command,
			distance,
		});
	}

	return commands;
}

/**
 * Añade embeds y componentes de una wiki de comando a la carga indicada.
 * @typedef {Object} WikiPageInjectionPayload
 * @property {Array<EmbedBuilder>} embeds 
 * @property {Array<ActionRowBuilder<import('discord.js').AnyComponentBuilder>>} components 
 * @param {CommandManager} command
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
		.setAuthor({ name: title(name), iconURL: Client.user.avatarURL({ extension: 'png', size: 512 }) })
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

module.exports = {
	searchCommand,
	searchCommands,
	injectWikiPage,
};
