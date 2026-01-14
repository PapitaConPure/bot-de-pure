import { EmbedBuilder, MessageFlags, StringSelectMenuInteraction } from 'discord.js';
import serverIds from '../../data/serverIds.json';
import userIds from '../../data/userIds.json';
import { tenshiColor } from '../../data/globalProps';
import { isNotModerator, shortenText } from '../../func';
import { p_pure } from '../../utils/prefixes';
import { commandFilenames, CommandOptions, CommandTags, Command, CommandParam, CommandTagResolvable } from '../Commons';
import { searchCommand, searchCommands, getWikiPageComponentsV2, makeCategoriesRow, makeGuideRow } from '../../systems/others/wiki';
import { ComplexCommandRequest } from '../Commons/typings';

const makeExcludedTags = (request: ComplexCommandRequest | StringSelectMenuInteraction<'cached'>) => {
	/**@type {Array<import('../Commons/cmdTags').CommandTagResolvable>}*/
	const excludedTags: Array<import('../Commons/cmdTags').CommandTagResolvable> = [ 'GUIDE' ];

	isNotModerator(request.member) && excludedTags.push('MOD');
	request.guildId !== serverIds.saki && excludedTags.push('SAKI');
	request.user.id !== userIds.papita && excludedTags.push('PAPA', 'MAINTENANCE', 'OUTDATED');

	return excludedTags;
};

const tags = new CommandTags().add('COMMON');

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

const command = new Command('ayuda', tags)
	.setAliases('comandos', 'acciones', 'help', 'commands', 'h')
	.setBriefDescription('Muestra una lista de comandos o un comando en detalle')
	.setLongDescription(
		'Muestra una lista de comandos deseada o un comando en detalle',
		'Al buscar listas de comandos, se filtran los comandos que tienen al menos uno de los `--identificadores` buscados',
		'Puedes hacer una búsqueda `--exclusiva` si solo quieres los comandos que tengan **todos** los identificadores buscados',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const guildPrefix = p_pure(request.guildId).raw;
		const helpCommand = `${guildPrefix}${command.name}`;

		const search = args.getString('comando');

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
					makeGuideRow(request),
				],
			});
		}

		const foundCommand = searchCommand(request, search);

		if(!foundCommand) {
			const embed = new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
				});
			const components = [makeGuideRow(request)];
			return request.reply({ embeds: [embed], components });
		}

		const components = getWikiPageComponentsV2(foundCommand, request);
		return request.reply({ flags: MessageFlags.IsComponentsV2, components });
	})
	.setSelectMenuResponse(async function viewCategory(interaction) {
		const guildPrefix = p_pure(interaction.guildId).raw;
		const helpCommand = `${guildPrefix}${command.name}`;

		const commands = lookupCommands({
			tags: interaction.values as CommandTagResolvable[],
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
				makeGuideRow(interaction),
			],
		});
	}, { userFilterIndex: 0 })
	.setButtonResponse(async function showCommand(interaction, search) {
		const request = Command.requestize(interaction);
		const guildPrefix = p_pure(request).raw;
		const helpCommand = `${guildPrefix}${command.name}`;

		const foundCommand = searchCommand(interaction, search);

		if(!foundCommand) {
			const embed = new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
				});
			const components = [makeGuideRow(request)];
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				embeds: [embed],
				components
			});
		}

		const components = getWikiPageComponentsV2(foundCommand, Command.requestize(interaction));
		return interaction.reply({
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			components,
		});
	})
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

		const foundCommand = searchCommand(interaction, search);

		if(!foundCommand) {
			const embed = new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
				});
			const components = [makeGuideRow(interaction)];
			return interaction.update({ embeds: [embed], components });
		}

		const components = getWikiPageComponentsV2(foundCommand, Command.requestize(interaction));
		return interaction.reply({ flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, components: components });
	}, { userFilterIndex: 0 });

export default command;
export interface CommandsLookupQuery {
	tags?: Array<import('../Commons/cmdTags').CommandTagResolvable>;
	excludedTags?: Array<import('../Commons/cmdTags').CommandTagResolvable>;
	context?: { member: import('discord.js').GuildMember; channel: import('discord.js').GuildChannelResolvable; };
}

/**@description Recupera un arreglo de {@linkcode Command} según la `query` proporcionada.*/
export function lookupCommands(query: CommandsLookupQuery = {}) {
	query.tags ??= [];
	query.excludedTags ??= [];
	const { tags, excludedTags, context } = query;

	/**@type {(command: Command) => boolean} */
	let commandIsAllowed: (command: Command) => boolean;
	if(context)
		commandIsAllowed = (command) => command.permissions?.isAllowedIn(context.member, context.channel) ?? true;
	else
		commandIsAllowed = () => true;

	let commandMeetsCriteria: (command: Command) => boolean;
	if(tags.length && excludedTags.length)
		commandMeetsCriteria = (command) => !excludedTags.some(tag => command.tags.has(tag)) && tags.every(tag => command.tags.has(tag));
	else if(tags.length)
		commandMeetsCriteria = (command) => tags.every(tag => command.tags.has(tag));
	else if(excludedTags.length)
		commandMeetsCriteria = (command) => !excludedTags.some(tag => command.tags.has(tag));
	else
		commandMeetsCriteria = () => true;

	const commands: Command[] = [];

	for(const file of commandFilenames) {
        const commandModule = require(`./${file}`);
        const command: Command = commandModule instanceof Command ? commandModule : commandModule.default;

		if(commandIsAllowed(command) && commandMeetsCriteria(command))
			commands.push(command);
	}

	return commands;
}
