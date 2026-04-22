import type { AnySelectMenuInteraction, GuildChannelResolvable, GuildMember } from 'discord.js';
import { ContainerBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import type { ComplexCommandRequest } from 'types/commands';
import { tenshiAltColor, tenshiColor } from '@/data/globalProps';
import userIds from '@/data/userIds.json';
import { isNotModerator, shortenText } from '@/func';
import {
	getWikiPageComponentsV2,
	makeCategoriesRow,
	makeGuideRow,
	searchCommand,
	searchCommands,
} from '@/systems/others/wiki';
import { p_pure } from '@/utils/prefixes';
import type { CommandTagResolvable } from '../commons';
import {
	Command,
	CommandOptions,
	CommandParam,
	CommandTags,
	fetchCommandsFromFiles,
} from '../commons';

const makeExcludedTags = (request: ComplexCommandRequest | AnySelectMenuInteraction<'cached'>) => {
	const excludedTags: Array<import('../commons/cmdTags').CommandTagResolvable> = ['GUIDE'];

	isNotModerator(request.member) && excludedTags.push('MOD');
	request.user.id !== userIds.papita && excludedTags.push('PAPA', 'MAINTENANCE', 'OUTDATED');

	return excludedTags;
};

const tags = new CommandTags().add('COMMON');

const options = new CommandOptions().addOptions(
	new CommandParam('comando', 'TEXT')
		.setDesc('para ver ayuda en un comando en específico')
		.setOptional(true)
		.setAutocomplete(async (interaction, query) => {
			const commands = await searchCommands(interaction, query);

			return interaction.respond(
				commands
					.sort(({ distance: a }, { distance: b }) => a - b)
					.slice(0, 10)
					.map(({ command }) => ({
						name: shortenText(
							`${command.name} - ${command.brief ?? command.desc ?? '...'}`,
							100,
						),
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

		if (!search)
			return request.reply({
				flags: MessageFlags.IsComponentsV2,
				components: await listCommands(request, ['COMMON']),
			});

		const foundCommand = await searchCommand(request, search);

		if (!foundCommand) {
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
	.setSelectMenuResponse(
		async function viewCategory(interaction) {
			return interaction.update({
				components: await listCommands(
					interaction,
					interaction.values as CommandTagResolvable[],
				),
			});
		},
		{ userFilterIndex: 0 },
	)
	.setButtonResponse(async function showCommand(interaction, search) {
		const request = Command.requestize(interaction);
		const guildPrefix = p_pure(request).raw;
		const helpCommand = `${guildPrefix}${command.name}`;

		const foundCommand = await searchCommand(interaction, search);

		if (!foundCommand) {
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
				components,
			});
		}

		const components = getWikiPageComponentsV2(foundCommand, Command.requestize(interaction));
		return interaction.reply({
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			components,
		});
	})
	.setSelectMenuResponse(
		async function viewGuideWiki(interaction) {
			const guildPrefix = p_pure(interaction.guildId).raw;
			const helpCommand = `${guildPrefix}${command.name}`;

			let search: string;
			switch (interaction.values[0]) {
				case 'index':
					search = 'g-introducción';
					break;
				case 'options':
					search = 'g-opciones';
					break;
				case 'params':
					search = 'g-parametros';
					break;
				case 'types':
					search = 'g-tipos';
					break;
				default:
					search = '';
					break;
			}

			const foundCommand = await searchCommand(interaction, search);

			if (!foundCommand) {
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

			const components = getWikiPageComponentsV2(
				foundCommand,
				Command.requestize(interaction),
			);
			return interaction.reply({
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				components: components,
			});
		},
		{ userFilterIndex: 0 },
	);

export default command;

async function listCommands(
	request: ComplexCommandRequest | AnySelectMenuInteraction<'cached'>,
	filter?: CommandTagResolvable[],
) {
	const prefix = p_pure(request).raw;
	const helpCommand = `${prefix}${command.name}`;

	const commands = await lookupCommands({
		tags: filter,
		excludedTags: makeExcludedTags(request),
		context: request,
	});

	const headerContainer: ContainerBuilder = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent('# <:guide:1369552945309290647> Centro de Ayuda'),
		)
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				'-# Aprende las diferentes formas de interactuar con Bot de Puré.',
			),
		);

	const contentContainer: ContainerBuilder = new ContainerBuilder()
		.setAccentColor(tenshiAltColor)
		.addTextDisplayComponents(
			(textDisplay) =>
				textDisplay.setContent(
					[
						'### -# Ejemplos de uso',
						`${prefix}avatar ${request.client.user}`,
						`${prefix}dados 5d6`,
					].join('\n'),
				),
			(textDisplay) =>
				textDisplay.setContent(
					[
						'### -# Emotes rápidos',
						'Para usar un **&comando de emote**, solo coloca & y el nombre de un comando en cualquier parte de tus mensajes.',
					].join('\n'),
				),
		)
		.addActionRowComponents(makeGuideRow(request))
		.addSeparatorComponents((separator) => separator.setDivider(true))
		.addTextDisplayComponents((textDisplay) =>
			textDisplay.setContent(
				(commands.length
					? [
							'### -# Lista de comandos',
							`Puedes usar ${helpCommand} con el nombre de alguno de estos comandos:`,
							commands.map((c) => `\`${c.name}\``).join(' '),
						]
					: [
							'### -# Lista de comandos',
							'Ningún comando que puedas usar tiene todas las categorías que indicaste. Prueba filtrando de manera menos estricta.',
						]
				).join('\n'),
			),
		)
		.addActionRowComponents(makeCategoriesRow(request, filter ?? []));

	return [headerContainer, contentContainer];
}

export interface CommandsLookupQuery {
	tags?: CommandTagResolvable[];
	excludedTags?: CommandTagResolvable[];
	context?: {
		member: GuildMember;
		channel?: GuildChannelResolvable | null;
	};
}

/**@description Recupera un arreglo de {@linkcode Command} según la `query` proporcionada.*/
export async function lookupCommands(query: CommandsLookupQuery = {}): Promise<Command[]> {
	query.tags ??= [];
	query.excludedTags ??= [];
	const { tags, excludedTags, context } = query;

	let commandIsAllowed: (command: Command) => boolean;
	if (context) {
		if (context.channel != null)
			commandIsAllowed = (command) =>
				command.permissions?.isAllowedIn(
					context.member,
					context.channel as GuildChannelResolvable,
				) ?? true;
		else commandIsAllowed = (command) => command.permissions?.isAllowed(context.member) ?? true;
	} else commandIsAllowed = () => true;

	let commandMeetsCriteria: (command: Command) => boolean;
	if (tags.length && excludedTags.length)
		commandMeetsCriteria = (command) =>
			!excludedTags.some((tag) => command.tags.has(tag))
			&& tags.every((tag) => command.tags.has(tag));
	else if (tags.length)
		commandMeetsCriteria = (command) => tags.every((tag) => command.tags.has(tag));
	else if (excludedTags.length)
		commandMeetsCriteria = (command) => !excludedTags.some((tag) => command.tags.has(tag));
	else commandMeetsCriteria = () => true;

	return fetchCommandsFromFiles({
		filter: (command) => commandIsAllowed(command) && commandMeetsCriteria(command),
	});
}
