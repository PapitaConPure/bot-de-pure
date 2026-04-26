import {
	ActionRowBuilder,
	type ApplicationCommandOptionChoiceData,
	AttachmentBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	Colors,
	EmbedBuilder,
	type Guild,
	type MessageEditOptions,
	MessageFlags,
	ModalBuilder,
	type StringSelectMenuBuilder,
	TextInputStyle,
} from 'discord.js';
import type { AnyCommandInteraction, ComplexCommandRequest } from 'types/commands';
import { Translator } from '@/i18n';
import type {
	TuberDocument,
	TuberInputVariantDocument,
	TuberSchemaType,
} from '@/models/tubers';
import TuberModel from '@/models/tubers';
import { getWikiPageComponentsV2 } from '@/systems/others/wiki';
import type { AdvancedTubercle, Tubercle } from '@/systems/ps/common/executeTuber';
import { CURRENT_PS_VERSION, executeTuber } from '@/systems/ps/common/executeTuber';
import { Input, type InputJSONData } from '@/systems/ps/v1.1/interpreter/inputReader';
import type { RuntimeValue } from '@/systems/ps/v1.1/interpreter/values';
import { fetchUserID, isNotModerator, navigationRows } from '@/utils/discord';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { compressId, decompressId } from '@/utils/encoding';
import { fetchExt } from '@/utils/fetchext';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import { edlDistance, shortenText } from '@/utils/misc';
import { p_pure } from '@/utils/prefixes';
import {
	Command,
	CommandOptionSolver,
	CommandOptions,
	CommandParam,
	CommandTags,
} from '../commons';
import { psDocsButton, psEditorButton } from './purescript';

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

/**@description Retorna un arreglo de ActionRowBuilders en respecto a la página actual y si la navegación por página está permitida.*/
function paginationRows(page: number, lastPage: number, navigationEnabled: boolean = true) {
	const rows: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] =
		[];

	if (navigationEnabled) rows.push(...navigationRows('tubérculo', page, lastPage));

	rows.push(
		new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('tubérculo_filterItems_AUTHOR')
				.setLabel('Filtrar Autor')
				.setEmoji(getBotEmojiResolvable('magGlassLeftWhite'))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('tubérculo_filterItems_TID')
				.setLabel('Filtrar TuberID')
				.setEmoji(getBotEmojiResolvable('magGlassLeftWhite'))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('tubérculo_filterClear')
				.setLabel('Mostrar todo')
				.setEmoji(getBotEmojiResolvable('xmarkWhite'))
				.setStyle(ButtonStyle.Danger),
		),
	);
	return rows;
}
const helpRows = () => [
	new ActionRowBuilder<ButtonBuilder>().addComponents(psEditorButton, psDocsButton),
];

async function getItemsList(guild: Guild, content?: string) {
	const tubers = await TuberModel.find({ guildId: guild.id });
	let items = tubers.toReversed();

	if (content) {
		const filter = content.split(': ');
		const [target, value] = filter;
		if (target === 'Autor') items = items.filter((tuber) => tuber.author === value);
		else items = items.filter((tuber) => tuber.tuberId.toLowerCase().indexOf(value) !== -1);
	}

	const lastPage = Math.ceil(items.length / pageMax) - 1;

	return { items, lastPage };
}

async function loadPageNumber(
	interaction: AnyCommandInteraction,
	page: number,
	setFilter?: string,
) {
	const { guild, message } = interaction;
	const { items, lastPage } = await getItemsList(guild, setFilter ?? message?.content);
	const members = guild.members.cache;
	const oembed = message?.embeds[0];
	const paginationEnabled = items.length >= pageMax;

	const listUpdate: MessageEditOptions = {
		embeds: [
			new EmbedBuilder()
				.setColor(oembed?.color ?? 0)
				.setAuthor({ name: oembed?.author?.name ?? '???', iconURL: oembed?.author?.url })
				.setTitle(oembed?.title ?? '...')
				.addFields({
					name: `🥔)▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${page + 1} / ${lastPage + 1} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬(🥔`,
					value: items.length
						? items
								.splice(page * pageMax, pageMax)
								.map(
									(tuber) =>
										`${tuber.script ? '`📜`' : ''}**${tuber.tuberId}** • ${(members.get(tuber.author) ?? guild.members.me)?.user.username}`,
								)
								.join('\n')
						: `Ningún Tubérculo coincide con la búsqueda actual`,
					inline: true,
				})
				.setFooter({
					iconURL: guild.iconURL({ size: 256 }) ?? undefined,
					text: `Total • ${items.length}`,
				}),
		],
		components: [...paginationRows(page, lastPage, paginationEnabled), ...helpRows()],
	};

	if (setFilter !== undefined) {
		if (setFilter) listUpdate.content = setFilter;
		else listUpdate.content = null;
	}

	if (interaction.isModalSubmit()) return interaction.message?.edit(listUpdate);
	else return interaction.update(listUpdate);
}

const helpString = (request: ComplexCommandRequest) =>
	[
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
				if (!query) return interaction.respond([]);

				const tubers = await TuberModel.find({ guildId: interaction.guildId });
				if (!tubers.length) return interaction.respond([]);

				const tubersArr = tubers
					.map((tuber) => [tuber, edlDistance(tuber.tuberId, query)] as const)
					.filter(([, distance]) => distance < 8);

				const existingTuber = tubersArr.find(([tuber]) => tuber.tuberId === query);

				const membersCache = interaction.guild.members.cache;
				const clientDisplayName = interaction.guild.members.me?.displayName;

				const options: ApplicationCommandOptionChoiceData[] = tubersArr
					.sort(([, aDistance], [, bDistance]) => aDistance - bDistance)
					.slice(0, +!!existingTuber + 24)
					.map(([tuber]) => {
						const tuberId = tuber.tuberId;
						const value = tuberId;

						let result = `${tuberId} - 👤 ${membersCache.get(tuber.author)?.displayName ?? clientDisplayName}`;

						if (tuber.advanced)
							result = `【📜v${tuber.psVersion}】${result} - 🧩 ${tuber.inputs?.length}`;
						else result = `【🥔】${tuberId}`;

						result = shortenText(tuberId, 100);

						return { name: result, value };
					});

				if (!existingTuber)
					options.unshift({
						name: `【💡+】${query}`,
						value: query,
					});

				return interaction.respond(options);
			}),
	)
	.addParam('mensaje', 'TEXT', 'para especificar el texto del mensaje', { optional: true })
	.addParam('archivos', 'FILE', 'para especificar los archivos del mensaje', {
		optional: true,
		poly: 'MULTIPLE',
		polymax: 8,
	})
	.addParam('entradas', 'TEXT', 'para especificar las entradas del Tubérculo avanzado', {
		optional: true,
		poly: 'MULTIPLE',
		polymax: 8,
	})
	.addFlag(['c', 'm'], ['crear', 'agregar', 'añadir'], 'para crear o editar un Tubérculo')
	.addFlag('v', 'ver', 'para ver detalles de un Tubérculo')
	.addFlag(['b', 'd'], ['borrar', 'eliminar'], 'para eliminar un Tubérculo')
	.addFlag(
		's',
		['script', 'puré', 'pure'],
		'para usar PuréScript (junto a `-c`); reemplaza la función de `<mensaje>`',
	);

const flags = new CommandTags().add('COMMON', 'MAINTENANCE');

const command = new Command(
	{
		es: 'tubérculo',
		en: 'tubercle',
		ja: 'custom',
	},
	flags,
)
	.setAliases('tuberculo', 'tubercle', 'tuber', 't')
	.setBriefDescription(
		'Permite crear, editar, listar, borrar o ejecutar comandos personalizados de servidor',
	)
	.setLongDescription(
		'Ofrece acciones de Tubérculos (comandos personalizados de servidor).',
		'Usar el comando sin nada lista todos los Tubérculos de este servidor',
		'Para `--crear` (o *editar*) un Tubérculo, se requerirá un `<mensaje>` y/o `<archivos>`, junto a la `<id>` que quieras darle al mismo. Si la ID ya existe, será *editada*',
		'Para `--borrar` un Tubérculo, igualmente debes indicar su `<id>`',
		'Escribe los indicadores `--crear --script` (o `-cs`) para crear un **Tubérculo avanzado con PuréScript**',
	)
	.addWikiRow(
		new ButtonBuilder()
			.setURL('https://papitaconpure.github.io/ps/')
			.setLabel(`Abrir editor de PuréScript (v${CURRENT_PS_VERSION})`)
			.setEmoji(getBotEmojiResolvable('psFullColor'))
			.setStyle(ButtonStyle.Link),
		new ButtonBuilder()
			.setURL('https://papitaconpure.github.io/ps-docs/')
			.setLabel(`Aprende PuréScript`)
			.setEmoji('📖')
			.setStyle(ButtonStyle.Link),
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const operation =
			args.flagIf('crear', 'crear')
			|| args.flagIf('ver', 'ver')
			|| args.flagIf('borrar', 'borrar');

		const isPureScript = args.hasFlag('script');
		const tuberId = args.getString('id');
		const members = request.guild.members.cache;

		if (operation == null && tuberId == null) {
			//Listar Tubérculos
			const { items, lastPage } = await getItemsList(request.guild);
			return request.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.LuminousVividPink)
						.setAuthor({
							name: request.guild.name,
							iconURL: request.guild.iconURL({ size: 256 }) ?? undefined,
						})
						.setTitle('Arsenal de Tubérculos del Servidor')
						.addFields({
							name: `🥔)▬▬▬\\~•\\~▬▬▬\\~•\\~▬▬{ ${items.length ? `1 / ${lastPage + 1}` : '- - -'} }▬▬\\~•\\~▬▬▬\\~•\\~▬▬▬(🥔`,
							value: items.length
								? items
										.splice(0, pageMax)
										.map(
											(tuber) =>
												`${tuber.script ? '`📜`' : ''}**${tuber.tuberId}** • ${(members.get(tuber.author) ?? request.guild.members.me)?.user.username}`,
										)
										.join('\n')
								: `Este servidor no tiene ningún Tubérculo.\nComienza a desplegar TuberIDs con \`${p_pure(request.guildId).raw}tubérculo --crear\``,
							inline: true,
						})
						.setFooter({
							iconURL: request.guild.iconURL({ size: 256 }) ?? undefined,
							text: `Total • ${items.length}`,
						}),
				],
				components: [
					...(items.length < pageMax ? [] : paginationRows(0, lastPage)),
					...helpRows(),
				],
			});
		}

		if (tuberId == null) {
			return request.reply({
				content: `⚠️ Debes indicar una TuberID válida para realizar una acción\n${helpString(request)}`,
			});
		}

		//Realizar operación sobre ID de Tubérculo
		const guildId = request.guild.id;

		switch (operation) {
			case 'crear':
				if (tuberId === '```arm')
					return request.reply({
						content: '¡No olvides indicar una TuberID al crear un Tubérculo!',
					});
				await createTuber(tuberId, guildId, isPureScript, request, args);
				break;
			case 'ver':
				await viewTuber(tuberId, guildId, request, 0);
				break;
			case 'borrar':
				await deleteTuber(tuberId, guildId, request);
				break;
			default:
				await opExecuteTuber(tuberId, guildId, isPureScript, request, args);
				break;
		}
	})
	.setButtonResponse(async function getHelp(interaction, userId) {
		const translator = await Translator.from(interaction.user);

		if (interaction.user.id !== userId)
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});

		const components = getWikiPageComponentsV2(
			command,
			Command.requestize(interaction),
			translator,
		);

		return interaction.reply({ flags: MessageFlags.IsComponentsV2, components });
	})
	.setButtonResponse(async function getTuberHelp(interaction, tuberId, variant, updateMessage) {
		if (!tuberId)
			return interaction.reply({
				content: '⚠️ Se esperaba una TuberID válida',
				flags: MessageFlags.Ephemeral,
			});

		const guildId = interaction.guild.id;

		return viewTuber(tuberId, guildId, interaction, +variant, updateMessage);
	})
	.setButtonResponse(async function loadPage(interaction, page) {
		return loadPageNumber(interaction, parseInt(page, 10));
	})
	.setButtonResponse(async function filterItems(interaction, target) {
		const filter = filters[target];

		const modal = new ModalBuilder()
			.setCustomId(`tubérculo_filterSubmit_${target}`)
			.setTitle('Filtro de búsqueda')
			.addLabelComponents((label) =>
				label
					.setLabel(filter.label)
					.setTextInputComponent((textInput) =>
						textInput
							.setCustomId('filterInput')
							.setPlaceholder(filter.placeholder)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(48)
							.setRequired(true),
					),
			);

		return interaction.showModal(modal);
	})
	.setModalResponse(async function filterSubmit(interaction, target) {
		const { guild, client } = interaction;

		let filter = interaction.fields.getTextInputValue('filterInput');
		if (target === 'AUTHOR') {
			if (filter.startsWith('@')) filter = filter.slice(1);
			const userId = await fetchUserID(filter, { guild, client });
			if (!userId)
				return interaction.reply({
					content: '⚠️ Usuario no encontrado',
					flags: MessageFlags.Ephemeral,
				});
			filter = userId;
		} else filter = filter.toLowerCase();
		const content = `${filters[target].label}: ${filter}`;
		return loadPageNumber(interaction, 0, content);
	})
	.setButtonResponse(async function filterClear(interaction) {
		if (!interaction.message.content)
			return interaction.reply({
				content: '⚠️ Esta lista ya muestra todos los resultados',
				flags: MessageFlags.Ephemeral,
			});

		return loadPageNumber(interaction, 0, '');
	})
	.setButtonResponse(async function getDesc(interaction, tuberId, userId) {
		userId = decompressId(userId);

		const tuber = await TuberModel.findOne({ tuberId, guildId: interaction.guildId });
		if (tuber == null)
			return interaction.reply({
				content: `⚠️️ El Tubérculo **${tuberId}** ya no existe`,
			});

		if (isNotModerator(interaction.member) && userId !== interaction.user.id) {
			const members = interaction.guild.members;
			return interaction.reply({
				content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${(members.cache.get(tuber.author) ?? members.me)?.user.username}*`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const modal = new ModalBuilder()
			.setCustomId(`t_setDesc_${tuberId}`)
			.setTitle('Describir Tubérculo')
			.setLabelComponents((label) =>
				label
					.setLabel('Descripción')
					.setTextInputComponent((textInput) =>
						textInput
							.setCustomId('descInput')
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(512),
					),
			);

		return interaction.showModal(modal);
	})
	.setButtonResponse(async function gID(interaction, tuberId, userId) {
		userId = decompressId(userId);

		const tuber = await TuberModel.findOne({ tuberId, guildId: interaction.guildId });
		if (tuber == null)
			return interaction.reply({
				content: `⚠️️ El Tubérculo **${tuberId}** ya no existe`,
			});

		if (isNotModerator(interaction.member) && userId !== interaction.user.id) {
			const members = interaction.guild.members;
			return interaction.reply({
				content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${(members.cache.get(tuber.author) ?? members.me)?.user.username}*`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const modal = new ModalBuilder()
			.setCustomId(`t_setIDesc_${tuberId}`)
			.setTitle('Describir Entrada')
			.setLabelComponents(
				(label) =>
					label
						.setLabel('Entrada')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('nameInput')
								.setStyle(TextInputStyle.Short)
								.setRequired(true)
								.setPlaceholder('Nombre de la entrada'),
						),
				(label) =>
					label
						.setLabel('Descripción')
						.setTextInputComponent((textInput) =>
							textInput
								.setCustomId('descInput')
								.setStyle(TextInputStyle.Paragraph)
								.setMaxLength(512),
						),
			);

		return interaction.showModal(modal);
	})
	.setSelectMenuResponse(async function loadPageExact(interaction) {
		return loadPageNumber(interaction, parseInt(interaction.values[0], 10));
	})
	.setModalResponse(async function setDesc(interaction, tuberId) {
		if (!tuberId)
			return interaction.reply({
				content: '⚠️ Se esperaba una TuberID válida',
				flags: MessageFlags.Ephemeral,
			});

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const tuber = await TuberModel.findOne({ tuberId, guildId: interaction.guild.id });
		if (tuber == null)
			return interaction.editReply({ content: `⚠️ La TuberID **${tuberId}** ya no existe` });

		if (isNotModerator(interaction.member) && tuber.author !== interaction.user.id) {
			const member =
				interaction.guild.members.cache.get(tuber.author) ?? interaction.guild.members.me;
			return interaction.reply({
				content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${member?.user.username}*`,
			});
		}

		const desc = interaction.fields.getTextInputValue('descInput');
		tuber.desc = desc;
		await tuber.save();

		return interaction.editReply({ content: '✅ Descripción actualizada' });
	})
	.setModalResponse(async function setIDesc(interaction, tuberId) {
		if (!tuberId)
			return interaction.reply({
				content: '⚠️ Se esperaba una TuberID válida',
				flags: MessageFlags.Ephemeral,
			});

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const tuber = await TuberModel.findOne({ tuberId, guildId: interaction.guild.id });
		if (tuber == null)
			return interaction.editReply({
				content: '⚠️ Este servidor no está registrado en la base de datos',
			});

		if (!Array.isArray(tuber.inputs))
			return interaction.editReply({
				content: '⚠️ Esta TuberID ya no existe, o no contiene entradas válidas',
			});

		if (isNotModerator(interaction.member) && tuber.author !== interaction.user.id) {
			const member =
				interaction.guild.members.cache.get(tuber.author) ?? interaction.guild.members.me;
			return interaction.reply({
				content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${member?.user.username}*`,
			});
		}

		const name = interaction.fields.getTextInputValue('nameInput');
		const desc = interaction.fields.getTextInputValue('descInput');

		const variants = tuber.inputs as unknown as InputJSONData[][];
		let found = false;
		variants?.forEach((variant, variantIndex) =>
			variant.forEach((input, inputIndex) => {
				if (Input.from(input).name === name) {
					const input = tuber.inputs[variantIndex][inputIndex];
					if (input) {
						input.desc = desc;
						tuber.markModified(`inputs.${variantIndex}.${inputIndex}.desc`);
					}

					found = true;
				}
			}),
		);

		if (!found)
			return interaction.editReply({
				content: `⚠️ El nombre de Entrada \`${shortenText(name, 128)}\` no existe en ninguna variante del Tubérculo **${shortenText(tuberId, 256)}**`,
			});

		await tuber.save();

		return interaction.editReply({
			content: `✅ Descripción de Entrada \`${shortenText(name, 256)}\` actualizada`,
		});
	});

async function createTuber(
	tuberId: string,
	guildId: string,
	isPureScript: boolean,
	request: ComplexCommandRequest,
	args: CommandOptionSolver,
) {
	if (tuberId.length > 24)
		return request.reply({ content: '⚠️️ Las TuberID solo pueden medir hasta 24 caracteres' });

	const alreadyExistingTuber = await TuberModel.findOne({ tuberId, guildId });
	if (
		alreadyExistingTuber
		&& isNotModerator(request.member)
		&& alreadyExistingTuber.author !== request.user.id
	)
		return request.reply({
			content: `⛔ Acción denegada. Esta TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(alreadyExistingTuber.author) ?? request.guild.members.me)?.user.username}*`,
		});

	const tuber = alreadyExistingTuber ?? new TuberModel({ tuberId, guildId });
	tuber.author = request.userId;
	tuber.advanced = isPureScript;
	tuber.saved = new Map();

	const codeTag = args.isInteractionSolver() ? 0 : args.rawArgs.match(/```[A-Za-z0-9]*/)?.[0];
	const messageFiles = CommandOptionSolver.asAttachments(
		args.parsePolyParamSync('archivos'),
	).filter((att) => att);
	const contentResult = await (async () => {
		const hasCodeImport = messageFiles[0]?.name.toLowerCase().endsWith('.tuber');
		const importCode = async () => {
			const fetchResult = await fetchExt(messageFiles[0]?.url ?? '', { type: 'text' });

			if (fetchResult.success === false)
				return {
					error: `${fetchResult.error}`,
					result: null as null,
				};

			return {
				error: null as null,
				result: fetchResult.data,
			};
		};

		if (args.isInteractionSolver()) {
			if (isPureScript && hasCodeImport) return importCode();

			return {
				error: null as null,
				result: args.getString('mensaje'),
			};
		}

		if (!isPureScript)
			return {
				error: null as null,
				result: args.remainder.split(/[\n ]*##[\n ]*/).join('\n'),
			};

		if (hasCodeImport) return importCode();

		if (!codeTag)
			return {
				error: [
					'Debes poner **\\`\\`\\`** antes y después del código.',
					'Esto hará que Discord le ponga el formato adecuado al código y que sea más fácil programar.',
					'Opcionalmente, puedes poner **\\`\\`\\`arm** en el del principio para colorear el código',
				].join('\n'),
				result: null as null,
			};

		const firstIndex = args.rawArgs.indexOf(codeTag);
		const lastIndex = args.rawArgs.lastIndexOf('```');
		return {
			error: null as null,
			result: args.rawArgs
				.slice(
					firstIndex + codeTag.length,
					lastIndex > firstIndex ? lastIndex : args.rawArgs.length,
				)
				.trim(),
		};
	})();

	if (contentResult.error != null) return request.reply({ content: contentResult.error });

	const mcontent = contentResult.result;

	//Incluir Tubérculo; crear colección de Tubérculos si es necesario
	if (tuber.advanced) {
		if (!mcontent)
			return request.reply({
				content: `⚠️️ Este Tubérculo requiere ingresar PuréScript\n${helpString(request)}`,
			});
		tuber.script = mcontent.replace(/```[A-Za-z0-9]*/, '');

		if (alreadyExistingTuber) alreadyExistingTuber.markModified('script');
	} else {
		if (!mcontent && !messageFiles.length)
			return request.reply({
				content: `⚠️️ Debes ingresar un mensaje o archivo para registrar un Tubérculo\n${helpString(request)}`,
			});
		if (mcontent) tuber.content = mcontent;
		if (messageFiles.length)
			tuber.files = messageFiles
				.map((messageFile) => messageFile?.url)
				.filter((f) => f != null);
	}

	try {
		console.log('Ejecutando PuréScript:', tuber);

		tuber.id = tuberId;
		if (tuber.advanced) tuber.psVersion = CURRENT_PS_VERSION;

		await request.deferReply();
		await fetchGuildMembers(request.guild);
		await executeTuber(request, tuber as unknown as Tubercle, { isTestDrive: true });

		if (tuber.advanced) {
			if (alreadyExistingTuber) {
				tuber.markModified('inputs');
				tuber.markModified('saved');
			}
		}

		console.log('PuréScript ejecutado:', tuber);
		await tuber.save();
	} catch (error) {
		console.log('Ocurrió un error al añadir un nuevo Tubérculo');
		console.error(error);
		const errorContent = {
			content:
				'❌ Hay un problema con el Tubérculo que intentaste crear, por lo que no se registrará',
		};
		return request.editReply(errorContent);
	}
}

async function viewTuber(
	tuberId: string,
	guildId: string,
	request: ComplexCommandRequest | ButtonInteraction<'cached'>,
	inputVariant: number,
	updateMessage?: string,
) {
	const item = (await TuberModel.findOne({ tuberId, guildId })) as TuberSchemaType;

	if (!item)
		return request.reply({
			withResponse: true,
			content: `⚠️️ El Tubérculo **${tuberId}** no existe`,
		});

	const author = request.guild.members.cache.get(item.author) ?? request.guild.members.me;

	const descriptionButtons = [
		new ButtonBuilder()
			.setCustomId(`t_getDesc_${tuberId}_${compressId(item.author)}`)
			.setLabel('Describir Tubérculo')
			.setEmoji('ℹ')
			.setStyle(ButtonStyle.Primary),
	];
	const variantButtons: ButtonBuilder[] = [];
	let files: AttachmentBuilder[] = [];
	const embed = new EmbedBuilder()
		.setColor(Colors.DarkVividPink)
		.setAuthor({
			name: request.guild.name,
			iconURL: request.guild.iconURL({ size: 256 }) ?? undefined,
		})
		.setTitle('Visor de Tubérculos')
		.addFields(
			{
				name: 'TuberID',
				value: tuberId,
				inline: true,
			},
			{
				name: 'Autor',
				value: author?.user.username ?? '???',
				inline: true,
			},
		);

	if (item.psVersion)
		embed.addFields({
			name: 'Versión',
			value: `\`PS v${item.psVersion}\``,
			inline: true,
		});

	if (item.desc)
		embed.addFields({
			name: 'Descripción',
			value: item.desc ?? '*Este Tubérculo no tiene descripción*',
		});

	if (item.script) {
		item.inputs ??= [];

		const pageCount = item.inputs.length;

		if (pageCount) {
			let inputStrings: string | undefined;
			let actuallyValid = true;

			const inputTitle = `Entradas (variante ${inputVariant + 1} de ${pageCount})`;
			const variant = item.inputs[inputVariant];
			if (variant.length === 0) actuallyValid = false;
			else inputStrings = variant.map((i) => Input.from(i).toString()).join('\n');

			if (actuallyValid) {
				embed.addFields({
					name: inputTitle,
					value: inputStrings as string,
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

		if (item.script.length >= 1020)
			files = [
				new AttachmentBuilder(Buffer.from(item.script, 'utf-8'), {
					name: 'PuréScript.txt',
				}),
			];
		else
			embed.addFields({
				name: 'PuréScript',
				value: ['```arm', `${item.script}`, '```'].join('\n'),
			});

		if (item.psVersion && item.inputs.length > 1) {
			const previousPage = inputVariant === 0 ? pageCount - 1 : inputVariant - 1;
			const nextPage = inputVariant === pageCount - 1 ? 0 : inputVariant + 1;
			variantButtons.push(
				new ButtonBuilder()
					.setCustomId(`tubérculo_getTuberHelp_${tuberId}_${previousPage}_A`)
					.setEmoji(getBotEmojiResolvable('navPrevAccent'))
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId(`tubérculo_getTuberHelp_${tuberId}_${nextPage}_B`)
					.setEmoji(getBotEmojiResolvable('navNextAccent'))
					.setStyle(ButtonStyle.Secondary),
			);
		}
	} else {
		if (item.content) embed.addFields({ name: 'Mensaje', value: item.content });
		if (item.files?.length)
			embed.addFields({
				name: 'Archivos',
				value: item.files.map((f, i) => `[${i}](${f})`).join(', '),
			});
	}

	const embeds = [embed];
	const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(...descriptionButtons)];
	if (variantButtons.length > 0)
		components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...variantButtons));

	return updateMessage
		? (request as ButtonInteraction).update({ embeds, files, components })
		: (request as ButtonInteraction).reply({ embeds, files, components });
}

async function deleteTuber(tuberId: string, guildId: string, request: ComplexCommandRequest) {
	const tuber = await TuberModel.findOne({ tuberId, guildId });

	if (tuber == null) return request.reply({ content: `⚠️️ El Tubérculo **${tuberId}** no existe` });

	if (isNotModerator(request.member) && tuber.author !== request.userId)
		return request.reply({
			content: `⛔ Acción denegada. La TuberID **${tuberId}** le pertenece a *${(request.guild.members.cache.get(tuber.author) ?? request.guild.members.me)?.user.username}*`,
		});

	await tuber.deleteOne();
	await request.reply({ content: '✅ Tubérculo eliminado con éxito' });
}

async function opExecuteTuber(
	tuberId: string,
	guildId: string,
	isPureScript: boolean,
	request: ComplexCommandRequest,
	args: CommandOptionSolver,
) {
	let tuber = await TuberModel.findOne({ tuberId, guildId });

	if (tuber == null) {
		const notFoundEmbed = new EmbedBuilder()
			.setColor(Colors.Orange)
			.setTitle(`⚠️️ El Tubérculo **${shortenText(tuberId, 64)}** no existe`)
			.setImage('https://i.imgur.com/LFzqoJX.jpg');

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`tubérculo_getHelp_${request.userId}`)
				.setLabel('Necesito ayuda')
				.setEmoji('💡')
				.setStyle(ButtonStyle.Primary),
		);

		let similar: Array<{ tuber: TuberDocument; distance: number }> = [];
		let superSimilar: { tuber: TuberDocument; distance: number } | undefined;
		if (tuberId.length > 1)
			similar = (await TuberModel.find({ guildId }))
				.filter((t) => t.tuberId.length > 1)
				.map((t) => ({ tuber: t, distance: edlDistance(tuberId, t.tuberId) }))
				.filter(({ distance }) => distance <= 3.5)
				.sort((a, b) => a.distance - b.distance)
				.slice(0, 5);

		if (similar[0]?.distance <= 0 && (similar[1] == null || similar[1].distance > 0))
			superSimilar = similar[0];

		if (superSimilar) {
			tuber = superSimilar.tuber;
		} else {
			if (similar.length) {
				notFoundEmbed.addFields({
					name: `TuberIDs similares a "${shortenText(tuberId, 80)}"`,
					value: similar
						.map(
							({ tuber, distance }) =>
								`• **${shortenText(tuber.tuberId, 152)}** (${distance > 0 ? `~${Math.round(100 - (distance / 3.5) * 100)}` : '>99'}%)`,
						)
						.join('\n'),
				});
			} else
				notFoundEmbed.addFields({
					name: 'Creación de Tubérculos',
					value: [
						`No se encontraron Tubérculos similares a "${shortenText(tuberId, 80)}".`,
						'¿Quieres crear un Tubérculo simple? ¡Usa la bandera `--crear` y maqueta la respuesta que desees!',
					].join('\n'),
				});

			if (isPureScript)
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

	const tuberArgs = CommandOptionSolver.asStrings(
		args.parsePolyParamSync('entradas', { regroupMethod: 'DOUBLE-QUOTES' }),
	).filter((input) => input);
	await request.deferReply();

	const savedData = tuber.saved != null ? new Map(tuber.saved) : undefined;
	await fetchGuildMembers(request.guild);

	try {
		await executeTuber(request, tuber as unknown as AdvancedTubercle, {
			args: tuberArgs,
			isTestDrive: false,
			overwrite: false,
			savedData: savedData as Map<string, RuntimeValue> | undefined,
		});

		tuber.inputs.forEach((variant, i) => {
			tuber.inputs[i] = (variant as unknown as Input[]).map(
				(input) => input.json ?? input,
			) as unknown as TuberInputVariantDocument;
		});

		tuber.markModified('saved');
		await tuber.save();
	} catch (err) {
		console.log('Ocurrió un error al ejecutar un Tubérculo');
		console.error(err);
		if (!tuber.script && err.name !== 'TuberInitializerError')
			await request.editReply({
				content:
					'❌ Parece que hay un problema con este Tubérculo. Si eres el creador, puedes modificarlo o eliminarlo. Si no, avísale al creador',
			});
	}
}

export default command;
