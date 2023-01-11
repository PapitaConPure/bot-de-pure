const { hourai, peopleid, tenshiColor } = require('../../localdata/config.json');
const Hourai = require('../../localdata/models/hourai.js');
const axios = require('axios').default;
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu, TextInputComponent, Modal } = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { auditError } = require('../../systems/auditor');
const { colorsRow } = require('../../localdata/houraiProps');
const { subdivideArray } = require('../../func');

/**
 * @typedef {{id: String, label: String, emote: String}} RoleData Datos de un rol para el propósito del comando
 * @typedef {Array<RoleData> | Array<Array<RoleData>>} RoleDataPool Conjunto de datos de rol o secciones de datos de rol
 * @typedef {'GAMES' | 'DRINKS' | 'FAITH'} CategoryIndex índice de categoría de autogestión de roles
 * @typedef {{ functionName: String, rolePool: RoleDataPool, exclusive: Boolean }} CategoryContent Contenido de categoría de autogestión de roles
 */
// const gameRoles = [
// 	{ id: '943412899689414726',  label: 'Minecraft', 		 emote: '🧊' },
// 	{ id: '763945846705487884',  label: 'Terraria', 		 emote: '🌳' },
// 	{ id: '1046526864560230440', label: 'Left 4 Dead', 	     emote: '🧟' },
// 	{ id: '936360594028757053',  label: 'League of Legends', emote: '👶' },
// 	{ id: '936360389711626280',  label: 'Tetris', 			 emote: '🟨' },
// 	{ id: '943412943159189537',  label: 'Risk of Rain 2', 	 emote: '🌧️' },
// 	{ id: '981040691981459476',  label: 'PAYDAY 2', 		 emote: '🗄️' },
// 	{ id: '938949774462304256',  label: 'Duck Game', 		 emote: '🦆' },
// 	{ id: '693886880667795577',  label: '100% OJ', 			 emote: '🍊' },
// 	{ id: '1046980064815890562', label: 'Power Bomberman', 	 emote: '💣' },
// 	{ id: '936360704783577178',  label: 'Ajedrez', 			 emote: '♟️' },
// 	{ id: '1044399017498525706', label: 'Sven', 		 	 emote: '🪕' },
// 	{ id: '936361454121132162',  label: 'Pokémon', 			 emote: '🦀' },
// 	{ id: '1014494653262856262', label: 'SRB2Kart', 		 emote: '🏎️' },
// ];
// /**@type {RoleDataPool}*/
// const drinkRoles = [
// 	{ id: '727951667513000007',  label: 'Té',          emote: '🍵' },
// 	{ id: '727951545509085204',  label: 'Café',        emote: '☕' },
// 	{ id: '727951759263137912',  label: 'Mate',        emote: '🧉' },
// 	{ id: '1049551360300945488', label: 'Chocolatada', emote: '🥛' },
// ];
// /**@type {RoleDataPool}*/
// const faithRoles = [
// 	{ id: '695744222850056212', label: 'Blessed', emote: '😇' },
// 	{ id: '695743527383990422', label: 'Blursed', emote: '🙃' },
// 	{ id: '694358587451113564', label: 'Cursed',  emote: '💀' },
// ];

// /**
//  * @type {{GAMES: CategoryContent, DRINKS: CategoryContent, FAITH: CategoryContent}}
//  */
// const categories = {
// 	GAMES:  { functionName: 'selectGame',     rolePool: gameRoles,  exclusive: false },
// 	DRINKS: { functionName: 'selectDrink',    rolePool: drinkRoles, exclusive: false },
// 	FAITH:  { functionName: 'selectReligion', rolePool: faithRoles, exclusive: true  },
// };
// for(const [i, category] of Object.entries(categories)) {
// 	categories[i].exlusive ??= false;
// 	categories[i].rolePool = subdivideArray(category.rolePool, 5);
// 	console.log(categories[i].rolePool);
// }

/**
 * @param {import('discord.js').GuildMember} member 
 * @param {CategoryIndex} category 
 * @param {Number?} section
 */
const getAutoRoleRows = (member, categories, category, section = null, removeAllLabel = 'Quitarse todos de página') => {
	if(!section || isNaN(section))
		section = 0;
		
	const rolePool = subdivideArray(categories[category].rolePool, 5);
	const pageRoles = rolePool[section];
	const rows = [];
	if(pageRoles.length)
		rows.push(
			new MessageActionRow().addComponents(pageRoles.map(role => {
				const button = new MessageButton()
					.setEmoji(role.emote)
					.setLabel(role.label);

				if(member.roles.cache.has(role.id))
					return button
						.setCustomId(`roles_removeRole_${role.id}`)
						.setStyle('PRIMARY');
				return button
					.setCustomId(`roles_addRole_${role.id}`)
					.setStyle('SECONDARY');
			})),
		);
	rows.push(
		new MessageActionRow().addComponents([
			new MessageButton()
				.setCustomId(`roles_removeAll_${category}`)
				.setEmoji('704612795072774164')
				.setLabel(removeAllLabel)
				.setStyle('DANGER'),
		])
	);
	
	return rows;
};
/**
 * @param {CategoryIndex} category 
 * @param {Number?} section 
 * @returns {Array<MessageActionRow>}
 */
const getPaginationControls = (categories, category, section = 0) => {
	category = categories[category];
	const rolePool = subdivideArray(category.rolePool, 5);
	if(rolePool.length < 2) return [];

	const functionName = category.functionName;
	const nextPage = section > 0 ? (section - 1) : (rolePool.length - 1)
	const prevPage = section < (rolePool.length - 1) ? (section + 1) : 0;
	return [
		new MessageActionRow().addComponents([
			new MessageButton()
				.setCustomId(`roles_${functionName}_${nextPage}_1`)
				.setEmoji('934430008343158844')
				.setStyle('SECONDARY'),
			new MessageButton()
				.setCustomId(`roles_${functionName}_${prevPage}_1`)
				.setEmoji('934430008250871818')
				.setStyle('SECONDARY'),
		]),
	];
};
/**
 * @param {import('discord.js').GuildMember} member 
 * @param {CategoryIndex} category 
 * @param {Number?} section
 */
const getEditButtonRow = (member, category) => {
	if(!member.permissions.has('MANAGE_ROLES'))
		return [];

	return [
		new MessageActionRow().addComponents([
			new MessageButton()
				.setCustomId(`roles_poolEdit_${category}`)
				.setLabel('Editar categoría')
				.setEmoji('819772377440583691')
				.setStyle('PRIMARY'),
		]),
	];
}

const flags = new CommandMetaFlagsManager().add('HOURAI');

const command = new CommandManager('roles', flags)
	.setAliases('rol', 'role')
	.setBriefDescription('Pemite a todos elegir algunos roles')
	.setLongDescription('Establece un punto de reparto de roles para uso colectivo (solo Hourai Doll')
	.setExecution(async request => {
		return request.reply({
			embeds: [
				new MessageEmbed()
					.setAuthor({ name: 'Punto de Reparto desplegado', iconURL: (request.author ?? request.user).avatarURL() })
					.setColor('GOLD')
					.addFields({ name: '¡Se están repartiendo roles!', value: 'Se ha establecido una campaña de suministro de roles. Usa el menú de abajo y selecciona la categoría que quieras' })
			],
			components: [new MessageActionRow().addComponents(
				new MessageSelectMenu()
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
							label: 'Colores',
							description: '¡Elige tu bando en Hourai Doll!',
							emoji: '853402616208949279',
							value: 'selectColor',
						},
						{
							label: 'Anuncios',
							description: '¡Recibe notificaciones de interés!',
							emoji: '654489124413374474',
							value: 'selectAnnouncement',
						},
						{
							label: 'Juegos',
							description: 'Roles mencionables para jugar juntos',
							emoji: '919133024770211880',
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
							emoji: '704612794921779290',
							value: 'selectReligion',
						},
						{
							label: '⚠️ Gacha',
							description: 'Trata y comercio de waifus; ludopatía',
							emoji: '697321858407727224',
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
		const selectMenu = new MessageSelectMenu(interaction.component);
		interaction.message.edit({ components: [ new MessageActionRow().addComponents(selectMenu) ] }).catch(auditError);
		if(!received)
			return this[operation](interaction);
		return this[operation](interaction, ...received);
	})
	.setInteractionResponse(async function selectCustomRole(interaction) {
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		/**@type {Date}*/
		const boostTimestamp = interaction.member?.premiumSinceTimestamp;
		const currentTimestamp = (new Date(Date.now())).getTime();
		const boostedRecently = ((currentTimestamp - boostTimestamp) < (60e3 * 60 * 24 * 35));
		const customRoleId = houraiDB.customRoles?.[interaction.user.id];

		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('WHITE')
					.addFields(
						{
							name: 'Rol Personalizado',
							value: [
								'Crea, modifica o elimina tu Rol Personalizado de Hourai Doll',
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
			components: [new MessageActionRow().addComponents(
				(!interaction.member.roles.cache.get(customRoleId)) ? [
					new MessageButton()
						.setCustomId('roles_customRole_CREATE')
						.setEmoji('💡')
						.setLabel('Crear rol')
						.setStyle('SUCCESS')
						.setDisabled(!boostedRecently),
				] : [
					new MessageButton()
						.setCustomId('roles_customRole_EDIT')
						.setEmoji('🎨')
						.setLabel('Editar rol')
						.setStyle('PRIMARY')
						.setDisabled(!boostedRecently),
					new MessageButton()
						.setCustomId('roles_customRole_DELETE')
						.setEmoji('🗑')
						.setLabel('Eliminar rol')
						.setStyle('DANGER'),
				]
			)],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectColor(interaction) {
		return interaction.reply({
			content: hourai.images.colors,
			components: [colorsRow],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectAnnouncement(interaction) {
		const newsRole = '699304214253404292';
		const hasNews = interaction.member.roles.cache.has(newsRole);
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('AQUA')
					.addFields({
						name: 'Anuncios del servidor',
						value: 'Serás notificado en <#674734540899483658> por noticias importantes, eventos y ocasionalmente festividades.\nEste rol te será útil si te interesa alguna o todas esas cosas. No mencionamos muy seguido, tranquilo',
					})
			],
			components: [new MessageActionRow().addComponents([
				new MessageButton()
					.setEmoji('654489124413374474')
					.setLabel('Anuncios')
					.setCustomId(`roles_${hasNews ? 'removeRole' : 'addRole'}_${newsRole}`)
					.setStyle(hasNews ? 'PRIMARY' : 'SECONDARY'),
			])],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectGame(interaction, section, edit = false) {
		section = parseInt(section);
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const messageActions = {
			embeds: [
				new MessageEmbed()
					.setColor('RED')
					.addFields({ name: 'Roles de Juego', value: 'Roles mencionables para llamar gente a jugar algunos juegos. Si piensas ser de los que llaman a jugar, intenta no abusar las menciones' }),
			],
			components: [
				...getAutoRoleRows(interaction.member, houraiDB.mentionRoles, 'GAMES', section),
				...getPaginationControls(houraiDB.mentionRoles, 'GAMES', section),
				...getEditButtonRow(interaction.member, 'GAMES'),
			],
			ephemeral: true,
		};

		if(edit) return interaction.update(messageActions);
		return interaction.reply(messageActions);
	})
	.setInteractionResponse(async function selectDrink(interaction, section, edit = false) {
		section = parseInt(section);
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const messageActions = {
			embeds: [
				new MessageEmbed()
					.setColor('BLUE')
					.addFields({ name: 'Roles de Bebidas', value: 'Roles decorativos para dar a conocer qué bebidas calientes disfrutas' }),
			],
			components: [
				...getAutoRoleRows(interaction.member, houraiDB.mentionRoles, 'DRINKS', section),
				...getPaginationControls(houraiDB.mentionRoles, 'DRINKS', section),
				...getEditButtonRow(interaction.member, 'DRINKS'),
			],
			ephemeral: true,
		};
		console.log(messageActions.components.map(c => c.components));

		if(edit) return interaction.update(messageActions);
		return interaction.reply(messageActions);
	})
	.setInteractionResponse(async function selectReligion(interaction, section, edit = false) {
		section = parseInt(section);
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});

		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('AQUA')
					.addFields({ name: 'Roles de Religión', value: 'Roles para describir tu actitud, ideas y forma de ser. No lo tomes muy en serio... ¿o tal vez sí?' })
			],
			components: [
				...getAutoRoleRows(interaction.member, houraiDB.mentionRoles, 'FAITH', section, 'Eliminar Religión'),
				...getPaginationControls(houraiDB.mentionRoles, 'FAITH', section),
				...getEditButtonRow(interaction.member, 'FAITH'),
			],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectGacha(interaction) {
		const gachaRole = '813194804161806436';
		const hasGacha = interaction.member.roles.cache.has(gachaRole);
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('DARK_GOLD')
					.addFields({
						name: 'Mercado de waifus',
						value: 'Ha de advertirse: una vez dentro, salir es complicado. Entra solo si estás preparado para lo que es básicamente una carrera de gacha con desconocidos y comercio sin regulación (incluye extorsiones)',
					})
			],
			components: [new MessageActionRow().addComponents([
				new MessageButton()
					.setEmoji('697321858407727224')
					.setLabel('Gacha')
					.setCustomId(`roles_${hasGacha ? 'removeRole' : 'addRole'}_${gachaRole}`)
					.setStyle(hasGacha ? 'PRIMARY' : 'SECONDARY'),
			])],
			ephemeral: true,
		});
	})
	.setInteractionResponse(async function selectCandy(interaction) {
		const candyRole = '683084373717024869';
		const hasCandy = interaction.member.roles.cache.has(candyRole);
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('DARK_PURPLE')
					.addFields({
						name: '¡Caramelos mágicos!',
						value: 'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.\nSe aceptan devoluciones para aplicantes previos, solo vomítalos con cuidado de dañarlos.',
					})
			],
			components: [new MessageActionRow().addComponents([
				new MessageButton()
					.setEmoji('778180421304188939')
					.setLabel('Caramelos (+18)')
					.setCustomId(`roles_${hasCandy ? 'removeRole' : 'addRole'}_${candyRole}`)
					.setStyle(hasCandy ? 'PRIMARY' : 'SECONDARY'),
			])],
			ephemeral: true,
		});
	})
	.setButtonResponse(async function addRole(interaction, roleId, category = null) {
		const { member } = interaction;

		if(member.roles.cache.has(roleId))
			return interaction.reply({ content: '⚠️ Ya tienes ese rol', ephemeral: true });

		/**@type {Array<MessageActionRow>}*/
		const newComponents = interaction.message.components;
		newComponents[0].components = newComponents[0].components.map(component => {
			const componentRid = component.customId.split('_')[2];
			
			if(roleId === componentRid) {
				if(!category)
					component.setCustomId(`roles_removeRole_${componentRid}`)
				return component.setStyle('PRIMARY');
			}
			if(category)
				return component.setStyle('SECONDARY');
			
			return component;
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
	.setButtonResponse(async function removeRole(interaction, roleId) {
		const { member } = interaction;

		if(!member.roles.cache.has(roleId))
			return interaction.reply({ content: '⚠️ No tienes ese rol', ephemeral: true });

		/**@type {Array<MessageActionRow>}*/
		const newComponents = interaction.message.components;
		newComponents[0].components = newComponents[0].components.map(component => {
			const componentRid = component.customId.split('_')[2];
			if(roleId !== componentRid) return component;
			
			if(component.style === 'PRIMARY')
				return component
					.setCustomId(`roles_addRole_${componentRid}`)
					.setStyle('SECONDARY');
			return component
				.setCustomId(`roles_removeRole_${componentRid}`)
				.setStyle('PRIMARY');
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

		/**@type {Array<MessageActionRow>}*/
		const newComponents = interaction.message.components;
		newComponents[0].components = newComponents[0].components.map(component => {
			const [ _, functionName, componentRid ] = component.customId.split('_');
			if(component.style === 'SECONDARY') return component;
			if(functionName === 'removeRole')
				component.setCustomId(`roles_addRole_${componentRid}`)
			return component.setStyle('SECONDARY');
		});

		await Promise.all([
			interaction.deferUpdate(),
			...rolePool.map(roleData => member.roles.remove(roleData.id)),
		]);
		interaction.editReply({ components: newComponents });
	})
	.setButtonResponse(async function customRole(interaction, operation) {
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const userId = interaction.user.id;
		houraiDB.customRoles ??= {};

		switch(operation) {
			case 'CREATE': {
				if(interaction.member.roles.cache.get(houraiDB.customRoles[userId]))
					return interaction.reply({ content: '⚠ ¡Tu rol ya fue creado! Si cancelaste la configuración, selecciona la categoría nuevamente para editarlo', ephemeral: true });
				const customRole = await interaction.guild.roles.create({
					name: interaction.member.nickname ?? interaction.user.username,
					position: (await interaction.guild.roles.fetch('857544764499951666'))?.rawPosition,
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
						ephemeral: true,
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
				content: `⚠ No se encontró tu Rol Personalizado. Prueba usando \`${p_pure(interaction.guildId).raw}roles\` una vez más para crear uno nuevo`,
				embeds: [],
				components: [],
			});
		
		const nameInput = new TextInputComponent()
			.setCustomId('nameInput')
			.setLabel('Nombre')
			.setStyle('SHORT')
			.setMaxLength(160)
			.setPlaceholder(`Ej: Bhavaagra Princess`);
		const colorInput = new TextInputComponent()
			.setCustomId('colorInput')
			.setLabel('Color (hexadecimal)')
			.setStyle('SHORT')
			.setMaxLength(7)
			.setPlaceholder(`Ej: ${tenshiColor}`);
		const emoteUrlInput = new TextInputComponent()
			.setCustomId('emoteUrlInput')
			.setLabel('Ícono')
			.setStyle('PARAGRAPH')
			.setMaxLength(160)
			.setPlaceholder('Ejemplo: https://cdn.discordapp.com/emojis/828736342372253697.webp');

		const rows = [
			new MessageActionRow().addComponents(nameInput),
			new MessageActionRow().addComponents(colorInput),
			new MessageActionRow().addComponents(emoteUrlInput),
		];

		const modal = new Modal()
			.setCustomId(`roles_applyCustomRoleChanges_${customRole.id}`)
			.setTitle('Edita tu Rol Personalizado')
			.addComponents(rows);
		
		return interaction.showModal(modal);
	})
	.setModalResponse(async function applyCustomRoleChanges(interaction, roleId, category = null) {
		/**@type {import('discord.js').Role}*/
		const customRole = interaction.member.roles.cache.get(roleId);
		if(!customRole) return interaction.reply({ content: '⚠ No se encontró el rol personalizado. Intenta crearlo otra vez', ephemeral: true });
		const roleName = interaction.fields.getTextInputValue('nameInput');
		let roleColor = interaction.fields.getTextInputValue('colorInput');
		let roleEmoteUrl = interaction.fields.getTextInputValue('emoteUrlInput');
		const editStack = [];
		const replyStack = [];

		if(roleName.length)
			editStack.push(
				customRole.edit({ name: roleName })
				.catch(_ => replyStack.push('⚠ No se pudo actualizar el nombre del rol'))
			);

		if(roleColor.length) {
			if(!roleColor.startsWith('#'))
				roleColor = `#${roleColor}`;
			editStack.push(
				customRole.edit({ color: roleColor })
				.catch(_ => replyStack.push('⚠ No se pudo actualizar el color del rol'))
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
					.catch(_ => replyStack.push('⚠ No se pudo actualizar el ícono del rol. Puede que el servidor sea de nivel muy bajo o no hayas proporcionado un enlace directo a la imagen'))
				);
			} catch(error) {
				replyStack.push('⚠ No se pudo actualizar el ícono del rol. Puede que no hayas proporcionado un enlace directo a la imagen o el enlace sea inválido');
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