const { hourai, tenshiColor } = require('../../data/config.json');
const Hourai = require('../../models/hourai.js');
const axios = require('axios').default;
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, TextInputBuilder, ModalBuilder, ButtonStyle, TextInputStyle, Colors } = require('discord.js');
const { p_pure } = require('../../utils/prefixes');
const { CommandTags, CommandManager, CommandOptions, CommandParam } = require('../Commons/commands');
const { auditError } = require('../../systems/others/auditor');
const { colorsRow } = require('../../data/sakiProps');
const { subdivideArray, isBoosting, stringHexToNumber } = require('../../func');
const { makeStringSelectMenuRowBuilder, makeButtonRowBuilder, makeTextInputRowBuilder } = require('../../utils/tsCasts');

/**
 * @typedef {{id: String, label: String, emote: String}} RoleData Datos de un rol para el propósito del comando
 * @typedef {Array<RoleData> | Array<Array<RoleData>>} RoleDataPool Conjunto de datos de rol o secciones de datos de rol
 * @typedef {'GAMES' | 'DRINKS' | 'FAITH'} CategoryIndex índice de categoría de autogestión de roles
 * @typedef {{ functionName: String, rolePool: RoleDataPool, exclusive: Boolean }} CategoryContent Contenido de categoría de autogestión de roles
 */

/**
 * @param {import('discord.js').GuildMember} member 
 * @param {CategoryIndex} category 
 * @param {Number?} section
 */
const getAutoRoleRows = (member, categories, category, section = null, exclusive = false, removeAllLabel = 'Quitarse todos de página') => {
	if(!section || isNaN(section))
		section = 0;
		
	const rolePool = subdivideArray(categories[category].rolePool, 5);
	const pageRoles = rolePool[section];
	const rows = [];
	if(pageRoles.length)
		rows.push(
			makeButtonRowBuilder().addComponents(pageRoles.map(role => {
				const button = new ButtonBuilder()
					.setEmoji(role.emote)
					.setLabel(role.label);

				let sectionArg = exclusive ? `_${section}` : '';

				if(member.roles.cache.has(role.id))
					return button
						.setCustomId(`roles_removeRole_${role.id}${sectionArg}`)
						.setStyle(ButtonStyle.Primary);
				return button
					.setCustomId(`roles_addRole_${role.id}`)
					.setStyle(ButtonStyle.Secondary);
			})),
		);
	rows.push(
		makeButtonRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId(`roles_removeAll_${category}`)
				.setEmoji('704612795072774164')
				.setLabel(removeAllLabel)
				.setStyle(ButtonStyle.Danger),
		])
	);
	
	return rows;
};

/**
 * @param {{ [ K: String ]: CategoryContent}} categories
 * @param {CategoryIndex} categoryName
 * @param {Number?} section 
 */
const getPaginationControls = (categories, categoryName, section = 0) => {
	const category = categories[categoryName];
	const rolePool = subdivideArray(/**@type {Array}*/(category.rolePool), 5);
	if(rolePool.length < 2) return [];

	const functionName = category.functionName;
	const nextPage = section > 0 ? (section - 1) : (rolePool.length - 1)
	const prevPage = section < (rolePool.length - 1) ? (section + 1) : 0;
	return [
		makeButtonRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId(`roles_${functionName}_${nextPage}_1`)
				.setEmoji('934430008343158844')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`roles_${functionName}_${prevPage}_1`)
				.setEmoji('934430008250871818')
				.setStyle(ButtonStyle.Secondary),
		]),
	];
};

/**
 * @param {import('discord.js').GuildMember} member 
 * @param {CategoryIndex} category 
 * /@/param {Number?} section
 */
const getEditButtonRow = (member, category) => {
	if(!member.permissions.has('ManageRoles'))
		return [];

	return [
		makeButtonRowBuilder().addComponents([
			new ButtonBuilder()
				.setCustomId(`roles_poolEdit_${category}`)
				.setLabel('Editar categoría')
				.setEmoji('819772377440583691')
				.setStyle(ButtonStyle.Primary),
		]),
	];
}

const options = new CommandOptions()
	.addOptions(
		new CommandParam('búsqueda', 'ROLE')
			.setDesc('para ofrecer colocarse un rol')
			.setOptional(true),
	);

const flags = new CommandTags().add('SAKI');

const command = new CommandManager('roles', flags)
	.setAliases('rol', 'role')
	.setOptions(options)
	.setBriefDescription('Pemite a todos elegir algunos roles')
	.setLongDescription('Establece un punto de reparto de roles para uso colectivo (solo Saki Scans). Alternativamente, puedes indicar un rol que quieras compartir')
	.setExecution(async (request, args) => {
		const role = args.getRole('búsqueda', true);

		if(role) {
			const houraiDB = /**@type {import('../../models/hourai.js').HouraiDocument}*/((await Hourai.findOne({})) || new Hourai({}));
			const mentionRoles = /**@type {{ [ K: String ]: CategoryContent }}*/(/**@type {unknown}*/(houraiDB.mentionRoles));

			const roleFound = Object.values(mentionRoles).some(category => category.rolePool.some(roleItem => {
				if(Array.isArray(roleItem))
					return roleItem.some(r => r.id === role.id);

				return (roleItem.id === role.id)
			}));

			if(!roleFound)
				return request.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(Colors.Red)
							.setTitle('Sin resultados')
							.setDescription(`❌ No se encontró el rol ${role} entre las categorías de roles de mención auto-asignables`)
					]
				});

			return request.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Gold)
						.setTitle('Ponte o quítate el rol')
						.setDescription(`${role}`),
				],
				components: [makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`roles_addRole_${role.id}__q`)
						.setEmoji('1291900911643263008')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`roles_removeRole_${role.id}_q`)
						.setEmoji('1051265954312617994')
						.setStyle(ButtonStyle.Danger),
				)]
			});
		}

		return request.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Gold)
					.setTitle('Selector de Roles')
					.setDescription('Cualquiera puede usar el menú debajo para elegir roles.'),
			],
			components: [new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId('roles_onSelect')
					.setPlaceholder('Elige una categoría')
					.setOptions([
						{
							label: 'Rol Personalizado (solo Boosters)',
							description: '¡Crea y edita tu propio rol! (solo uno)',
							emoji: '919114849894690837',
							value: 'selectCustomRole',
						},
						{
							label: 'Anuncios',
							description: '¡Recibe notificaciones de interés!',
							emoji: '704612794921779290',
							value: 'selectAnnouncement',
						},
						{
							label: 'Colores',
							description: '¡Elige tu bando en Saki Scans!',
							emoji: '1107843515385389128',
							value: 'selectColor',
						},
						{
							label: 'Juegos',
							description: 'Roles mencionables para jugar juntos',
							emoji: '1237762773006680124',
							value: 'selectGame_0',
						},
						{
							label: 'Bebidas',
							description: 'Destaca tus bebidas calientes favoritas',
							emoji: '739512946354421770',
							value: 'selectDrink',
						},
						{
							label: 'Religión',
							description: 'Describe tu naturaleza',
							emoji: '819772377440583691',
							value: 'selectReligion',
						},
						{
							label: '⚠️️ Gacha',
							description: 'Trata y comercio de waifus; ludopatía',
							emoji: '796930823068057600',
							value: 'selectGacha',
						},
						{
							label: '🔞 Caramelos',
							description: 'Cargados de amor siniestro',
							emoji: '778180421304188939',
							value: 'selectCandy',
						},
					]),
			)],
		});
    })
	.setSelectMenuResponse(async function onSelect(interaction) {
		const received = interaction.values[0].split('_');
		const operation = received.shift();
		const selectMenu = StringSelectMenuBuilder.from(interaction.component);
		interaction.message.edit({ components: [ makeStringSelectMenuRowBuilder().addComponents(selectMenu) ] }).catch(auditError);
		if(!received)
			return command[operation](interaction);
		return command[operation](interaction, ...received);
	})
	.setInteractionResponse(async function selectCustomRole(interaction) {
		if(!interaction.isRepliable())
			return;

		if(!interaction.inCachedGuild())
			return interaction.reply({ content: '❌' });

		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const boostedRecently = isBoosting(interaction.member) || interaction.user.id === require('../../data/config.json').peopleid.papita;
		const customRoleId = houraiDB.customRoles?.[interaction.user.id];

		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.White)
					.addFields(
						{
							name: 'Rol Personalizado',
							value: [
								'Crea, modifica o elimina tu Rol Personalizado de Saki Scans',
								'Esto es una recompensa para aquellos que boostean el servidor',
							].join('\n'),
						},
						{
							name: 'Edición de Rol Personalizado',
							value: [
								'Puedes editar tu Rol cuantas veces quieras durante el periodo de boosteo',
								'Se te permite modificar el nombre, el color y/o la imagen del rol a gusto',
							].join('\n'),
						},
					),
			],
			components: [makeButtonRowBuilder().addComponents(
				(!interaction.member.roles.cache.get(customRoleId)) ? [
					new ButtonBuilder()
						.setCustomId('roles_customRole_CREATE')
						.setEmoji('💡')
						.setLabel('Crear rol')
						.setStyle(ButtonStyle.Success)
						.setDisabled(!boostedRecently),
				] : [
					new ButtonBuilder()
						.setCustomId('roles_customRole_EDIT')
						.setEmoji('🎨')
						.setLabel('Editar rol')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(!boostedRecently),
					new ButtonBuilder()
						.setCustomId('roles_customRole_DELETE')
						.setEmoji('🗑')
						.setLabel('Eliminar rol')
						.setStyle(ButtonStyle.Danger),
				]
			)],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectColor(interaction) {
		if(!interaction.isRepliable())
			return;

		if(!interaction.inCachedGuild())
			return interaction.reply({ content: '❌' });

		return interaction.reply({
			content: hourai.images.colors,
			components: [colorsRow],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectAnnouncement(interaction) {
		if(!interaction.isRepliable())
			return;

		if(!interaction.inCachedGuild())
			return interaction.reply({ content: '❌' });
		
		const newsRole = '1107852759442665592';
		const hasNews = interaction.member.roles.cache.has(newsRole);
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Aqua)
					.addFields({
						name: 'Anuncios del servidor',
						value: `Serás notificado en <#${hourai.announcementChannelId}> por noticias importantes, eventos y ocasionalmente festividades.\nEste rol te será útil si te interesa alguna o todas esas cosas. No mencionamos muy seguido, tranquilo`,
					})
			],
			components: [makeButtonRowBuilder().addComponents([
				new ButtonBuilder()
					.setEmoji('1107843515385389128')
					.setLabel('Anuncios')
					.setCustomId(`roles_${hasNews ? 'removeRole' : 'addRole'}_${newsRole}`)
					.setStyle(hasNews ? ButtonStyle.Primary : ButtonStyle.Secondary),
			])],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectGame(interaction, sectionNumber, edit) {
		if(!interaction.inCachedGuild())
			return interaction.isRepliable() && interaction.reply({ content: '❌' });
		
		const section = parseInt(sectionNumber);
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const mentionRoles = /**@type {{ [ K: String ]: CategoryContent }}*/(/**@type {unknown}*/(houraiDB.mentionRoles));
		const messageActions = {
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.addFields({ name: 'Roles de Juego', value: 'Roles mencionables para llamar gente a jugar algunos juegos. Si piensas ser de los que llaman a jugar, intenta no abusar las menciones' }),
			],
			components: [
				...getAutoRoleRows(interaction.member, mentionRoles, 'GAMES', section),
				...getPaginationControls(mentionRoles, 'GAMES', section),
				...getEditButtonRow(interaction.member, 'GAMES'),
			],
			ephemeral: true,
		};

		if(edit) return interaction.isMessageComponent() && interaction.update(messageActions);
		return interaction.isRepliable() && interaction.reply(messageActions);
	})
	.setInteractionResponse(async function selectDrink(interaction, sectionNumber, edit) {
		if(!interaction.isRepliable())
			return;

		if(!interaction.inCachedGuild())
			return interaction.reply({ content: '❌' });
		
		const section = parseInt(sectionNumber);
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const mentionRoles = /**@type {{ [ K: String ]: CategoryContent }}*/(/**@type {unknown}*/(houraiDB.mentionRoles));
		const messageActions = {
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Blue)
					.addFields({ name: 'Roles de Bebidas', value: 'Roles decorativos para dar a conocer qué bebidas calientes disfrutas' }),
			],
			components: [
				...getAutoRoleRows(interaction.member, mentionRoles, 'DRINKS', section),
				...getPaginationControls(mentionRoles, 'DRINKS', section),
				...getEditButtonRow(interaction.member, 'DRINKS'),
			],
			ephemeral: true,
		};

		if(edit) return ('update' in interaction) && interaction.update(messageActions);
		return interaction.reply(messageActions);
	})
	.setSelectMenuResponse(async function selectReligion(interaction, sectionNumber) {
		const section = parseInt(sectionNumber);
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const mentionRoles = /**@type {{ [ K: String ]: CategoryContent }}*/(/**@type {unknown}*/(houraiDB.mentionRoles));

		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Aqua)
					.addFields({ name: 'Roles de Religión', value: 'Roles para describir tu actitud, ideas y forma de ser. No lo tomes muy en serio... ¿o tal vez sí?' })
			],
			components: [
				...getAutoRoleRows(interaction.member, mentionRoles, 'FAITH', section, true, 'Eliminar Religión'),
				...getPaginationControls(mentionRoles, 'FAITH', section),
				...getEditButtonRow(interaction.member, 'FAITH'),
			],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectGacha(interaction) {
		if(!interaction.isRepliable())
			return;

		if(!interaction.inCachedGuild())
			return interaction.reply({ content: '❌' });

		return interaction.reply({ content: '🚫 Desactivado por tiempo indefinido', ephemeral: true });
	})
	.setInteractionResponse(async function selectCandy(interaction) {
		if(!interaction.isRepliable())
			return;

		if(!interaction.inCachedGuild())
			return interaction.reply({ content: '❌' });
		
		if(!interaction.member.roles.cache.has('1107831054791876691'))
			return interaction.reply({ content: '🚫 No tienes permiso para hacer eso', ephemeral: true });
		
		const candyRole = hourai.candyRoleId;
		const hasCandy = interaction.member.roles.cache.has(candyRole);
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.DarkPurple)
					.addFields({
						name: '¡Caramelos mágicos!',
						value: [
							'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.',
							'Se aceptan devoluciones para aplicantes previos, solo vomítalos con cuidado de dañarlos.',
							'**ADVERTENCIA:** al recibir estos caramelos, aceptas ser mayor de edad y ser responsable por lo que veas y publiques en los callejones que se revelen',
						].join('\n'),
					})
			],
			components: [makeButtonRowBuilder().addComponents([
				new ButtonBuilder()
					.setEmoji('778180421304188939')
					.setLabel('Caramelos (+18)')
					.setCustomId(`roles_${hasCandy ? 'removeRole' : 'addRole'}_${candyRole}`)
					.setStyle(hasCandy ? ButtonStyle.Primary : ButtonStyle.Secondary),
			])],
			ephemeral: true,
		});
	})
	.setButtonResponse(async function addRole(interaction, roleId, category, requested) {
		const { member } = interaction;

		if(member.roles.cache.has(roleId))
			return interaction.reply({ content: '⚠️️ Ya tienes ese rol', ephemeral: true });

		if(requested === 'q') {
			await Promise.all([
				interaction.deferReply({ ephemeral: true }),
				interaction.member.roles.add(roleId),
			]);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Green)
						.setTitle('✅ Hecho')
						.setDescription(`Se te asignó el rol <@&${roleId}> correctamente`)
				],
			});
		}

		const newComponents = interaction.message.components;
		//@ts-expect-error
		newComponents[0].components = newComponents[0].components.map(component => {
			const newComponent = ButtonBuilder.from(/**@type {import('discord.js').JSONEncodable<import('discord.js').APIButtonComponent>}*/(component));
			const componentRid = component.customId.split('_')[2];
			
			if(roleId === componentRid) {
				if(!category)
					newComponent.setCustomId(`roles_removeRole_${componentRid}`)
				return newComponent.setStyle(ButtonStyle.Primary);
			}
			if(category)
				return newComponent.setStyle(ButtonStyle.Secondary);
			
			return newComponent;
		});

		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		let rolesToRemove = [];
		if(category)
			rolesToRemove = houraiDB.mentionRoles[category].rolePool
				.filter(role => role.id !== roleId && member.roles.cache.has(role.id))
				.map(role => member.roles.remove(role.id));
		
		await Promise.all([
			interaction.deferUpdate(),
			...rolesToRemove,
			member.roles.add(roleId),
		]);
		return interaction.editReply({ components: newComponents });
	})
	.setButtonResponse(async function removeRole(interaction, roleId, requested) {
		const { member } = interaction;

		if(!member.roles.cache.has(roleId))
			return interaction.reply({ content: '⚠️️ No tienes ese rol', ephemeral: true });

		if(requested === 'q') {
			await Promise.all([
				interaction.deferReply({ ephemeral: true }),
				interaction.member.roles.remove(roleId),
			]);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Green)
						.setTitle('✅ Hecho')
						.setDescription(`Se te quitó el rol <@&${roleId}> correctamente`)
				],
			});
		}

		const newComponents = interaction.message.components;
		//@ts-expect-error
		newComponents[0].components = newComponents[0].components.map(component => {
			const newComponent = ButtonBuilder.from(/**@type {import('discord.js').JSONEncodable<import('discord.js').APIButtonComponent>}*/(component));
			const componentRid = component.customId.split('_')[2];
			if(roleId !== componentRid) return newComponent;
			
			if(/**@type {import('discord.js').ButtonComponent}*/(component).style === ButtonStyle.Primary)
				return newComponent
					.setCustomId(`roles_addRole_${componentRid}`)
					.setStyle(ButtonStyle.Secondary);
			return newComponent
				.setCustomId(`roles_removeRole_${componentRid}`)
				.setStyle(ButtonStyle.Primary);
		});

		return Promise.all([
			member.roles.remove(roleId),
			interaction.update({ components: newComponents }),
		]);
	})
	.setButtonResponse(async function removeAll(interaction, category) {
		const { member } = interaction;
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const rolePool = houraiDB.mentionRoles[category].rolePool
			.filter(roleData => member.roles.cache.has(roleData.id));

		if(!rolePool.length)
			return interaction.reply({ content: '❌ No tienes ningún rol de esta categoría', ephemeral: true });

		const newComponents = interaction.message.components;
		//@ts-expect-error
		newComponents[0].components = newComponents[0].components.map(component => {
			const newComponent = ButtonBuilder.from(/**@type {import('discord.js').JSONEncodable<import('discord.js').APIButtonComponent>}*/(component));
			const [ , functionName, componentRid ] = component.customId.split('_');
			if(/**@type {import('discord.js').ButtonComponent}*/(component).style === ButtonStyle.Secondary) return newComponent;
			if(functionName === 'removeRole')
				newComponent.setCustomId(`roles_addRole_${componentRid}`)
			return newComponent.setStyle(ButtonStyle.Secondary);
		});

		await Promise.all([
			interaction.deferUpdate(),
			...rolePool.map(roleData => member.roles.remove(roleData.id)),
		]);
		interaction.editReply({ components: newComponents });
	})
	.setButtonResponse(async function customRole(interaction, operation) {
		const houraiDB = (await Hourai.findOne({})) || new Hourai({ customRoles: {} });
		const userId = interaction.user.id;

		switch(operation) {
			case 'CREATE': {
				if(interaction.member.roles.cache.get(houraiDB.customRoles[userId]))
					return interaction.reply({ content: '⚠️ ¡Tu rol ya fue creado! Si cancelaste la configuración o la interacción falló, selecciona la categoría nuevamente para editarlo', ephemeral: true });
					
				const customRole = await interaction.guild.roles.create({
					name: interaction.member.nickname ?? interaction.user.username,
					position: (await interaction.guild.roles.fetch('1108486398719295612'))?.rawPosition,
					reason: 'Creación de Rol Personalizado de miembro',
				});
				houraiDB.customRoles[userId] = customRole.id;
				houraiDB.markModified('customRoles');
				await Promise.all([
					houraiDB.save(),
					interaction.member.roles.add(customRole),
				]);

				return module.exports.customRoleWizard(interaction, customRole.id);
			}
			
			case 'EDIT': {
				const roleId = houraiDB.customRoles[userId];
				return module.exports.customRoleWizard(interaction, roleId);
			}

			case 'DELETE': {
				const roleId = houraiDB.customRoles[userId];
				houraiDB.customRoles[userId] = null;
				delete houraiDB.customRoles[userId];
				houraiDB.markModified('customRoles');

				return Promise.all([
					interaction.guild.roles.delete(roleId, 'Eliminación de Rol Personalizado de miembro'),
					houraiDB.save(),
					interaction.update({
						content: '🗑 Rol personalizado eliminado',
						embeds: [],
						components: [],
					}),
				]);
			}
		}
	})
	.setButtonResponse(async function customRoleWizard(interaction, roleId) {
		/**@type {import('discord.js').Role}*/
		const customRole = interaction.member.roles.cache.get(roleId);
		if(!customRole)
			return interaction.update({
				content: `⚠️ No se encontró tu Rol Personalizado. Prueba usando \`${p_pure(interaction.guildId).raw}roles\` una vez más para crear uno nuevo`,
				embeds: [],
				components: [],
			});
		
		const nameInput = new TextInputBuilder()
			.setCustomId('nameInput')
			.setLabel('Nombre')
			.setStyle(TextInputStyle.Short)
			.setRequired(false)
			.setMaxLength(158)
			.setPlaceholder(`Ej: Bhavaagra Princess`);
		
		const colorInput = new TextInputBuilder()
			.setCustomId('colorInput')
			.setLabel('Color (hexadecimal)')
			.setStyle(TextInputStyle.Short)
			.setRequired(false)
			.setMaxLength(7)
			.setPlaceholder(`Ej: ${tenshiColor.toString(16)}`);
		const emoteUrlInput = new TextInputBuilder()
			.setCustomId('emoteUrlInput')
			.setLabel('Ícono')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setMaxLength(160)
			.setPlaceholder('Ejemplo: https://cdn.discordapp.com/emojis/828736342372253697.webp');

		const rows = [
			makeTextInputRowBuilder().addComponents(nameInput),
			makeTextInputRowBuilder().addComponents(colorInput),
			makeTextInputRowBuilder().addComponents(emoteUrlInput),
		];

		const modal = new ModalBuilder()
			.setCustomId(`roles_applyCustomRoleChanges_${customRole.id}`)
			.setTitle('Edita tu Rol Personalizado')
			.addComponents(rows);
		
		return interaction.showModal(modal).catch(() => {});
	})
	.setModalResponse(async function applyCustomRoleChanges(interaction, roleId) {
		/**@type {import('discord.js').Role}*/
		const customRole = interaction.member.roles.cache.get(roleId);
		if(!customRole) return interaction.reply({ content: '⚠️ No se encontró el rol personalizado. Intenta crearlo otra vez', ephemeral: true });
		const roleName = interaction.fields.getTextInputValue('nameInput');
		let roleColor = interaction.fields.getTextInputValue('colorInput');
		let roleEmoteUrl = interaction.fields.getTextInputValue('emoteUrlInput');
		const editStack = [];
		const replyStack = [];

		if(roleName.length)
			editStack.push(
				customRole.edit({ name: `✨ ${roleName}` })
				.catch(() => replyStack.push('⚠️ No se pudo actualizar el nombre del rol'))
			);

		if(roleColor.length) {
			const roleColorNumber = stringHexToNumber(roleColor);
			editStack.push(
				customRole.edit({ color: roleColorNumber })
				.catch(() => replyStack.push('⚠️ No se pudo actualizar el color del rol'))
			);
		}

		if(roleEmoteUrl.length) {
			if(!roleEmoteUrl.startsWith('https://'))
				roleEmoteUrl = `https://${roleEmoteUrl}`;
			const imgurUrl = 'https://imgur.com/';
			if(roleEmoteUrl.startsWith(imgurUrl)) {
				roleEmoteUrl = roleEmoteUrl.slice(imgurUrl.length);
				if(roleEmoteUrl.startsWith('a/'))
				roleEmoteUrl = roleEmoteUrl.slice(2);
				roleEmoteUrl = `https://i.imgur.com/${roleEmoteUrl}.png`;
			}

			try {
				const response = await axios.get(roleEmoteUrl,  { responseType: 'arraybuffer' });
				const roleEmoteBuffer = Buffer.from(response?.data, "utf-8")
				editStack.push(
					customRole.edit({ icon: roleEmoteBuffer })
					.catch(() => replyStack.push('⚠️ No se pudo actualizar el ícono del rol. Puede que el servidor sea de nivel muy bajo o no hayas proporcionado un enlace directo a la imagen'))
				);
			} catch {
				replyStack.push('⚠️ No se pudo actualizar el ícono del rol. Puede que no hayas proporcionado un enlace directo a la imagen o el enlace sea inválido');
			}
		}

		replyStack.push('✅ Edición de Rol Personalizado finalizada')

		await Promise.all([
			interaction.deferReply({ ephemeral: true }),
			...editStack,
		]);
		interaction.editReply({ content: replyStack.join('\n') });
	});

module.exports = command;