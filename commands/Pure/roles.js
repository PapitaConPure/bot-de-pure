const { hourai, peopleid } = require('../../localdata/config.json');
const Hourai = require('../../localdata/models/hourai.js');
const { colorsRow } = require('./colores.js')
const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes');

const getAddRemoveRows = (roles) => [
	new MessageActionRow().addComponents(roles.map(role =>
		new MessageButton()
			.setCustomId(`roles_addRole_${role.id}`)
			.setEmoji(role.emote)
			.setLabel(role.label)
			.setStyle('SUCCESS'),
	)),
	new MessageActionRow().addComponents(roles.map(role =>
		new MessageButton()
			.setCustomId(`roles_removeRole_${role.id}`)
			.setEmoji(role.emote)
			.setLabel(role.label)
			.setStyle('DANGER'),
	)),
	new MessageActionRow().addComponents([
		new MessageButton()
			.setCustomId(`roles_removeMany_${roles.map(role => role.id).join('_')}`)
			.setEmoji('704612795072774164')
			.setLabel('Quitarse todos')
			.setStyle('PRIMARY'),
	]),
];

module.exports = {
	name: 'roles',
	aliases: [
		'rol',
		'role',
	],
    desc: 'Establece un punto de reparto de roles para uso colectivo (solo Hourai Doll)',
    flags: [
        'hourai',
    ],
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} _
	 * @param {Boolean} isSlash
	 */
	async execute(request, _) {
		return await request.reply({
			embeds: [
				new MessageEmbed()
					.setAuthor({ name: 'Punto de Reparto desplegado', iconURL: (request.author ?? request.user).avatarURL() })
					.setColor('GOLD')
					.addField('¡Se están repartiendo roles!', 'Se ha establecido una campaña de suministro de roles. Usa el menú de abajo y selecciona la categoría que quieras')
			],
			components: [new MessageActionRow().addComponents(
				new MessageSelectMenu()
					.setCustomId('roles_onSelect')
					.setPlaceholder('Elige una categoría')
					.setOptions([
						{
							label: 'Rol Personalizado (solo Boosters)',
							description: '¡Crea y edita tu propio rol! (solo uno)',
							emoji: '778180421304188939',
							value: 'selectCustomRole',
						},
						{
							label: 'Colores',
							description: '¡Elige tu bando en Hourai Doll!',
							emoji: '853402616208949279',
							value: 'selectColor',
						},
						{
							label: 'Juegos',
							description: 'Roles mencionables para jugar juntos',
							emoji: '919133024770211880',
							value: 'selectGame_0',
						},
						{
							label: 'Juegos 2',
							description: 'Roles mencionables para jugar juntos',
							emoji: '919133024770211880',
							value: 'selectGame_1',
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
							label: 'Caramelos',
							description: 'Cargados de amor siniestro',
							emoji: '778180421304188939',
							value: 'selectCandy',
						},
					]),
			)],
		});
    },

	async ['onSelect'](interaction) {
		const received = interaction.values[0].split('_');
		const operation = received.shift();
		const args = received.shift();
		if(args)
			return await module.exports[operation](interaction, [args]);
		else
			return await module.exports[operation](interaction);
	},

	async ['selectColor'](interaction) {
		return await interaction.reply({
			files: [hourai.images.colors],
			components: [colorsRow],
			ephemeral: true,
		});
    },

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 */
	async ['selectCustomRole'](interaction) {
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		/**@type {Date}*/
		const boostTimestamp = interaction.member?.premiumSinceTimestamp;
		const currentTimestamp = (new Date(Date.now())).getTime();
		const boostedRecently = (currentTimestamp - boostTimestamp) < (60e3 * 60 * 24 * 35);
		const allowed = interaction.user.id === peopleid.papita || boostedRecently;
		const customRoleId = houraiDB.customRoles?.[interaction.user.id];

		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('WHITE')
					.addField('Rol Personalizado', [
						'Crea, modifica o elimina tu Rol Personalizado de Hourai Doll',
						'Esto es una recompensa para aquellos que boostean el servidor',
						'Nótese que esta característica todavía no está disponible. Espera un tiempo a que se implemente',
					].join('\n')),
			],
			components: [new MessageActionRow().addComponents(
				(!interaction.member.roles.cache.get(customRoleId)) ? [
					new MessageButton()
						.setCustomId('roles_customRole_CREATE')
						.setEmoji('💡')
						.setLabel('Crear rol')
						.setStyle('SUCCESS')
						.setDisabled(!allowed),
				] : [
					new MessageButton()
						.setCustomId('roles_customRole_EDIT')
						.setEmoji('🎨')
						.setLabel('Editar rol')
						.setStyle('PRIMARY')
						.setDisabled(!allowed),
					new MessageButton()
						.setCustomId('roles_customRole_DELETE')
						.setEmoji('🗑')
						.setLabel('Eliminar Religión')
						.setStyle('DANGER')
						.setDisabled(!allowed),
				]
			)],
			ephemeral: true,
		});
    },

	async ['selectGame'](interaction, [section]) {
		const gameRoles = [
			[ //Sección 0
				{ id: '943412899689414726', emote: '🧊', label: 'Minecraft' },
				{ id: '763945846705487884', emote: '🌳', label: 'Terraria'  },
				{ id: '936360389711626280', emote: '🟨', label: 'Tetris'    },
				{ id: '938949774462304256', emote: '🦆', label: 'Duck Game' },
			],
			[ //Sección 1
				{ id: '936360594028757053', emote: '👶', label: 'LoL'       },
				{ id: '693886880667795577', emote: '🍊', label: '100% OJ'   },
				{ id: '936360704783577178', emote: '♟️', label: 'Ajedrez'   },
				{ id: '936361454121132162', emote: '🦀', label: 'Pokémon'   },
			],
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('RED')
					.addField('Roles de Juego', 'Roles mencionables para llamar gente a jugar algunos juegos. Si piensas ser de los que llaman a jugar, intenta no abusar las menciones')
			],
			components: getAddRemoveRows(gameRoles[section]),
			ephemeral: true,
		});
    },
	
	async ['selectDrink'](interaction) {
		const drinkRoles = [
			{ id: '727951667513000007', emote: '🍵', label: 'Té' },
			{ id: '727951545509085204', emote: '☕', label: 'Café' },
			{ id: '727951759263137912', emote: '🧉', label: 'Mate' },
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('BLUE')
					.addField('Roles de Bebidas', 'Roles decorativos para dar a conocer qué bebidas calientes disfrutas')
			],
			components: getAddRemoveRows(drinkRoles),
			ephemeral: true,
		});
    },
	
	async ['selectReligion'](interaction) {
		const gameRoles = [
			{ id: '695744222850056212', emote: '😇', label: 'Blessed' },
			{ id: '695743527383990422', emote: '🙃', label: 'Blursed' },
			{ id: '694358587451113564', emote: '💀', label: 'Cursed' },
		];
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('AQUA')
					.addField('Roles de Religión', 'Roles para describir tu actitud, ideas y forma de ser. No lo tomes muy en serio... ¿o tal vez sí?')
			],
			components: [
				new MessageActionRow().addComponents(gameRoles.map(gameRole =>
					new MessageButton()
						.setCustomId(`roles_addRoleExclusive_${gameRole.id}_${gameRoles.map(gameRole => gameRole.id).join('_')}`)
						.setEmoji(gameRole.emote)
						.setLabel(gameRole.label)
						.setStyle('SUCCESS'),
				)),
				new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(`roles_removeMany_${gameRoles.map(gameRole => gameRole.id).join('_')}`)
						.setEmoji('704612795072774164')
						.setLabel('Eliminar Religión')
						.setStyle('DANGER'),
				]),
			],
			ephemeral: true,
		});
    },
	
	async ['selectCandy'](interaction) {
		const candyRole = '683084373717024869';
		return await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('DARK_PURPLE')
					.addField('¡Caramelos mágicos!', 'Antiguos relatos cuentan que permiten ver trazos de lujuria grabados en el aire.\nSe aceptan devoluciones para aplicantes previos, solo vomítalos con cuidado de dañarlos.')
			],
			components: [new MessageActionRow().addComponents([
				new MessageButton()
					.setCustomId(`roles_addRole_${candyRole}`)
					.setEmoji('778180421304188939')
					.setLabel('Recibir')
					.setStyle('SUCCESS'),
				new MessageButton()
					.setCustomId(`roles_removeRole_${candyRole}`)
					.setEmoji('704612795072774164')
					.setLabel('Devolver')
					.setStyle('DANGER'),
			])],
			ephemeral: true,
		});
    },

	async ['addRole'](interaction, args) {
		const { member } = interaction;
		const rid = args.shift();
		if(member.roles.cache.has(rid))
			return await interaction.reply({ content: '⚠️ Ya tienes ese rol', ephemeral: true });
		
		return await Promise.all([
			member.roles.add(rid),
			interaction.reply({ content: '✅ Rol entregado', ephemeral: true }),
		]);
    },

	async ['addRoleExclusive'](interaction, args) {
		const { member } = interaction;
		const newRoleId = args.shift();
		if(member.roles.cache.has(newRoleId))
			return await interaction.reply({ content: '⚠️ Ya tienes ese rol', ephemeral: true })

		await Promise.all(
			args.filter(rid => rid !== newRoleId).map(rid =>
				member.roles.cache.has(rid)
				? member.roles.remove(rid)
				: undefined
			)
		);
		return await Promise.all([
			member.roles.add(newRoleId),
			interaction.reply({ content: '✅ Rol entregado', ephemeral: true }),
		]);
    },

	async ['removeRole'](interaction, args) {
		const { member } = interaction;
		const [ rid ] = args;
		if(!member.roles.cache.has(rid))
			return await interaction.reply({ content: '⚠️ No tienes ese rol', ephemeral: true });
		return await Promise.all([
			member.roles.remove(rid),
			interaction.reply({ content: '✅ Rol quitado', ephemeral: true }),
		]);
    },

	async ['removeMany'](interaction, args) {
		const { member } = interaction;
		await Promise.all(
			args
			.map(rid => member.roles.cache.has(rid) ? member.roles.remove(rid) : undefined)
			.filter(rid => rid)
		);
		interaction.reply({ content: '✅ Roles actualizados', ephemeral: true });
    },

	/**@param {import('discord.js').ButtonInteraction} interaction*/
	async ['customRole'](interaction, [ operation ]) {
		const houraiDB = (await Hourai.findOne({})) || new Hourai({});
		const uid = interaction.user.id;
		switch(operation) {
			case 'CREATE': {
				houraiDB.customRoles ??= {};
				const customRole = await interaction.guild.roles.create({
					name: interaction.member.nickname ?? interaction.user.username,
					position: (await interaction.guild.roles.fetch('857544764499951666'))?.rawPosition,
					reason: 'Creación de rol personalizado de miembro',
				});
				houraiDB.customRoles[uid] = customRole.id;
				houraiDB.markModified('customRoles');
				await Promise.all([
					houraiDB.save(),
					interaction.member.roles.add(customRole),
				]);

				return await module.exports.customRoleWizard(interaction, customRole.id);
			}
			
			case 'EDIT': {
				const roleId = houraiDB.customRoles[uid];
				return await module.exports.customRoleWizard(interaction, roleId);
			}

			case 'DELETE': {
				houraiDB.customRoles[uid] = null;
				delete houraiDB.customRoles[uid];
				houraiDB.markModified('customRoles');

				return await Promise.all([
					interaction.member.roles.remove(roleId),
					houraiDB.save(),
					interaction.update({
						content: '🗑 Rol personalizado eliminado',
						components: [],
						ephemeral: true,
					}),
				]);
			}
		}
	},

	/**@param {import('discord.js').ButtonInteraction} interaction*/
	async customRoleWizard(interaction, roleId) {
		/**@type {import('discord.js').Role}*/
		const customRole = interaction.member.roles.cache.get(roleId);
		if(!customRole)
			return await interaction.update({
				content: `⚠ No se encontró tu Rol Personalizado. Prueba usando \`${p_pure(interaction.guildId).raw}roles\` una vez más para crear uno nuevo`,
				embeds: [],
				components: [],
			});

		const embed = new MessageEmbed()
			.setColor('NAVY')
			.addField('Personaliza tu rol', 'Especifica el nombre, código de color hexadecimal y/o enlace de ícono de tu rol')
			.addField('Edición', 'Envía en uno o varios mensajes las propiedades mencionadas, no te olvides del "#" para el código hexadecimal')
			.addField('Finalizar', 'Escribe "Listo" cuando hayas terminado de editar. Si no finalizas manualmente, la edición finalizará automáticamente luego de 5 minutos');
		
		const filter = m => !m.author.bot && m.author.id === interaction.user.id;
		const coll = interaction.channel.createMessageCollector({ filter, time: 60e3 * 5, maxProcessed: 10 });

		coll.on('collect', m => {
			if(!m.content) return;
			if(m.content.toLowerCase() === 'listo')
				return coll.stop();

			const reportSuccess = (prop) => m.reply({ content: `✅ ${prop} de Rol Personalizado actualizado` });
			const reportError = (prop, extra) => m.reply({ content: [`⚠ ${prop} de Rol Personalizado no se pudo actualizar`, extra].filter(r => r).join('\n') });
			let args = m.content.split(/[ \n]+/);
			args = args.map(arg => {
				if(arg.startsWith('https://')) {
					customRole.edit({ icon: arg })
					.then(() => reportSuccess('Ícono'))
					.catch(() => reportError('Ícono', 'Puede que el server necesite más boosts para cambiar esto'));
					return;
				}

				if(arg.startsWith('#')) {
					customRole.edit({ color: arg })
					.then(() => reportSuccess('Color'))
					.catch(() => reportError('Color'));
					return;
				}

				return arg;
			}).filter(arg => arg);

			if(args.length)
				return customRole.edit({ name: args.join(' ') })
				.then(() => reportSuccess('Nombre'))
				.catch(() => reportError('Nombre'));
		});

		coll.on('end', () => interaction.channel.send({ content: '✅ Edición de Rol Personalizado finalizada' }));

		return await interaction.update({
			embeds: [embed],
			components: [],
		});
	}
};