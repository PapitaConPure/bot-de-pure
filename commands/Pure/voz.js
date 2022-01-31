const PureVoice = require('../../localdata/models/purevoice.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageCollector } = require('discord.js');
const { p_pure } = require('../../localdata/prefixget.js');
const { isNotModerator, fetchFlag } = require('../../func.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts.js');

const cancelbutton = (id) => new MessageButton()
	.setCustomId(`voz_cancelWizard_${id}`)
	.setLabel('Cancelar')
	.setStyle('SECONDARY');
const collectors = {};
/**
 * @param {Number} stepCount
 * @param {String} stepName
 * @param {import('discord.js').ColorResolvable} stepColor
 * @param {String} route
 */
const wizEmbed = (iconUrl, stepName, stepColor, route = 'none') => {
	//const routes = {
	//	['create']: 	5, //2 + seleccionar categoría + seleccionar/crear canal de texto + seleccionar/crear/ignorar canal de voz AFK
	//	['edit']: 		4, //2 + seleccionar operación + operación
	//	['delete']: 	3, //2 + confirmación/opciones de borrado
	//};
	return new MessageEmbed()
		.setColor(stepColor)
		.setAuthor('Asistente de Configuración de Sistema PuréVoice', iconUrl)
		.setFooter(stepName);
};

const options = new CommandOptionsManager()
	.addParam('nombre', 'TEXT', 'para decidir el nombre de la sesión actual', { optional: true })
	.addFlag('aiw', ['asistente','instalador','wizard'], 'para inicializar el Asistente de Configuración');

module.exports = {
	name: 'voz',
	aliases: [
		'purévoz', 'purevoz',
		'purévoice', 'purevoice', 'voice',
	],
	brief: 'Para inyectar un Sistema PuréVoice en una categoria por medio de un Asistente',
	desc: 'Para inyectar un Sistema PuréVoice en una categoria. Simplemente usa el comando y sigue los pasos del Asistente para configurar todo',
	flags: [
		'common',
	],
	options: options,
	experimental: true,
	callx: options.callSyntax,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		const generateWizard = isSlash
		? args.getBoolean('asistente')
		: fetchFlag(args, { ...options.flags.get('asistente').structure, callback: true });
		
		//Cambiar nomre de canal de voz de sesión
		if(!generateWizard) {
			const helpstr = `Usa \`${p_pure(request.guildId).raw}ayuda voz\` para más información`;
			const sessionName = isSlash
				? args.getString('nombre')
				: args.join(' ');

			if(!sessionName)
				return await request.reply({
					content: [
						'⚠ Debes ingresar un nombre para ejecutar este comando de esta forma',
						'Si estás buscando iniciar un Asistente de Configuración, usa la bandera `--asistente` o `-a`',
						helpstr,
					].join('\n'),
					ephemeral: true,
				});
			
			if(sessionName.length > 24)
				return await request.reply({
					content: '⚠ Intenta acortar un poco el nombre. El límite para nombres de sesión es de 24(+3) caracteres',
					ephemeral: true,
				});
			
			//Comprobar si se está en una sesión
			/**@type {import('discord.js').VoiceState}*/
			const voiceState = request.member.voice;
			const warnNotInSession = () => request.reply({
				content: [
					'⚠ Debes entrar a una sesión PuréVoice para ejecutar este comando de esta forma.',
					helpstr,
				].join('\n'),
				ephemeral: true,
			}).catch(console.error);
			if(!voiceState.channelId)
				return await warnNotInSession();
			const pv = await PureVoice.findOne({ guildId: request.guildId });
			if(!(pv && pv.sessions.map(session => session.voiceId).includes(voiceState.channelId)))
				return await warnNotInSession();

			//Modificar sesión y confirmar
			const chcache = request.guild.channels.cache;
			const { textId, voiceId } = pv.sessions.find(session => session.voiceId === voiceState.channelId);
			if(!voiceState.channel.name.match('💠「」')) return await request.reply({ content: '❌ Por cuestiones técnicas, solo puedes cambiar el nombre de la sesión una vez.\nSi quieres cambiar el nombre, conéctate a una nueva sesión' })
			let sessionNumber = voiceState.channel.name.match(/\d+/);
			if(sessionNumber) sessionNumber = sessionNumber[0];
			await chcache.get(voiceId).setName(`💠「${sessionName}」`).catch(console.error);
			await chcache.get(textId).setName(`${sessionName.toLowerCase().split().join('-')}`).catch(console.error);
			return await request.reply({ content: '✅ Nombre aplicado', ephemeral: true }).catch(console.error);
		}
		
		//Inicializar instalador PuréVoice
		if(isNotModerator(request.member)) return await request.reply({ content: '❌ No tienes permiso para hacer esto', ephemeral: true });
		const wizard = wizEmbed(request.client.user.avatarURL(), '1/? • Comenzar', 'AQUA')
		.addField('Bienvenido', 'Si es la primera vez que configuras un Sistema PuréVoice, ¡no te preocupes! Solo sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras');
		const uid = (request.author ?? request.user).id;
		return await request.reply({
			embeds: [wizard],
			components: [new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(`voz_startWizard_${uid}`)
					.setLabel('Comenzar')
					.setStyle('PRIMARY'),
				cancelbutton(uid),
			)],
		});
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<String>} param1 
	 */
	async ['startWizard'](interaction, [ authorId ]) {
		const { user, guild } = interaction;
		if(user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), '2/? • Seleccionar Operación', 'NAVY')
			.addField('Inyección de Sistema PuréVoice', '¿Qué deseas hacer ahora mismo?');
			
		const pv = await PureVoice.findOne({ guildId: guild.id });
		const uid = user.id;
		const row = new MessageActionRow();
		const isInstalled = pv && guild.channels.cache.get(pv.categoryId) && guild.channels.cache.get(pv.voiceMakerId);
		if(!isInstalled)
			row.addComponents(
				new MessageButton()
					.setCustomId(`voz_selectInstallation_${uid}`)
					.setLabel('Instalar')
					.setStyle('PRIMARY'),
			);
		else 
			row.addComponents(
				new MessageButton()
					.setCustomId(`voz_relocateSystem_${uid}`)
					.setLabel('Reubicar')
					.setStyle('PRIMARY'),
			);

		row.addComponents(
			new MessageButton()
				.setCustomId(`voz_deleteSystem_${uid}`)
				.setLabel('Desinstalar')
				.setStyle('DANGER')
				.setDisabled(!isInstalled),
			cancelbutton(uid),
		);
		return await interaction.update({
			embeds: [wizard],
			components: [row],
		});
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<String>} param1 
	 */
	async ['selectInstallation'](interaction, [ authorId ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });

		const wizard = wizEmbed(interaction.client.user.avatarURL(), '3/4 • Seleccionar instalación', 'GOLD')
			.addField('Instalación', 'Selecciona el tipo de instalación que deseas realizar');
		const row = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`voz_installSystem_${authorId}_new`)
				.setLabel('Crear categoría con PuréVoice')
				.setStyle('SUCCESS'),
			new MessageButton()
				.setCustomId(`voz_installSystem_${authorId}`)
				.setLabel('Inyectar PuréVoice en categoría')
				.setStyle('PRIMARY'),
			cancelbutton(authorId),
		);
		return await interaction.update({
			embeds: [wizard],
			components: [row],
		});
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<String>} param1 
	 */
	async ['installSystem'](interaction, [ authorId, createNew ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const filter = (m) => m.author.id === authorId;
		collectors[interaction.id] = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 2 });
		collectors[interaction.id].on('collect', async collected => {
			let ccontent = collected.content;
			let category;
			if(!createNew) {
				if(ccontent.startsWith('<#') && ccontent.endsWith('>')) {
					ccontent = ccontent.slice(2, -1);
					if(ccontent.startsWith('!')) ccontent = ccontent.slice(1);
				}
				const categories = interaction.guild.channels.cache.filter(c => c.type === 'GUILD_CATEGORY');
				category = isNaN(ccontent)
					? categories.find(c => c.name.toLowerCase().indexOf(ccontent) !== -1)
					: categories.find(c => c.id === ccontent);
				if(category) {
					collected.delete().catch(() => console.log('Error menor al borrar mensaje recolectado'));
					collectors[interaction.id].stop();
				} else return;
			} else {
				await collected.delete().catch(() => console.log('Error menor al borrar mensaje recolectado'));
				category = await interaction.guild.channels.create(ccontent, { type: 'GUILD_CATEGORY', reason: 'Categoría recipiente de PuréVoice' });
			}
			
			try {
				const voiceMaker = await interaction.guild.channels.create('➕ Nueva Sesión', {
					type: 'GUILD_VOICE',
					parent: category.id,
					bitrate: 64 * 1000,
					userLimit: 1,
					reason: 'Desplegar Canal Autoextensible PuréVoice',
				});

				//Guardar nueva categoría PuréVoice
				const guildQuery = { guildId: interaction.guild.id };
				await PureVoice.deleteOne(guildQuery);
				const pv = new PureVoice({
					...guildQuery,
					categoryId: category.id,
					voiceMakerId: voiceMaker.id,
				});

				const wizard = wizEmbed(interaction.client.user.avatarURL(), 'Operación finalizada', 'GREEN')
					.addField('Categoría creada e inyectada', [
						'Se ha creado una categoría que ahora escala de forma dinámica sus canales de voz.',
						`Puedes reubicar el Sistema PuréVoice creado en el futuro, solo usa \`${p_pure(interaction.guildId).raw}voz\` otra vez`,
					].join('\n'));

				const finished = await Promise.all([
					pv.save(),
					interaction.message.edit({
						embeds: [wizard],
						components: [],
					}),
				]);
				collectors[interaction.id].stop();
				delete collectors[interaction.id];
				return finished;
			} catch(error) {
				console.error(error);
				return await interaction.channel.send({ content: [
					'⚠ Ocurrió un error al crear esta categoría',
					'Asegúrate de que tenga los permisos necesarios para realizar esta acción (administrar canales)',
					'También, verifica que el nombre ingresado no esté ya ocupado por alguna otra categoría o canal',
				].join('\n') });
			}
		});
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), `4/4 • ${createNew ? 'Nombrar' : 'Seleccionar'} categoría`, 'NAVY')
			.addField(`${createNew ? 'Creación' : 'Selección'} de categoría`, 'Menciona el nombre de la categoría antes de inyectarle PuréVoice');
		const uid = interaction.user.id;
		const row = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`voz_startWizard_${uid}`)
				.setLabel('Volver')
				.setStyle('SECONDARY'),
			cancelbutton(uid),
		);
		return await interaction.update({
			embeds: [wizard],
			components: [row],
		});
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<String>} param1 
	 */
	async ['deleteSystem'](interaction, [ authorId ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), 'Confirmar desinstalación', 'YELLOW')
			.addField('Desinstalación del Sistema PuréVoice del servidor', 'Esto borrará todas los canales creados por el Sistema. La categoría del Sistema y los canales creados manualmente se ignorarán.\nConfirma la desasociación del servidor con PuréVoice');
		const uid = interaction.user.id;
		const row = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`voz_deleteSystemConfirmed_${uid}`)
				.setLabel('DESINSTALAR')
				.setStyle('DANGER'),
			new MessageButton()
				.setCustomId(`voz_startWizard_${uid}`)
				.setLabel('Volver')
				.setStyle('SECONDARY'),
			cancelbutton(uid),
		);
		return await interaction.update({
			embeds: [wizard],
			components: [row],
		});
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<String>} param1 
	 */
	async ['deleteSystemConfirmed'](interaction, [ authorId ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });

		//Eliminar Sistema PuréVoice
		const guildQuery = { guildId: interaction.guild.id };
		const pv = await PureVoice.findOne(guildQuery);
		if(pv) {
			const guildChannels = interaction.guild.channels.cache;
			await guildChannels.get(pv.voiceMakerId).delete(`PuréVoice desinstalado por ${interaction.user.tag}`);
			await Promise.all(pv.sessions.map(({ textId, voiceId }) => Promise.all([
				guildChannels.get(textId).delete().catch(console.error),
				guildChannels.get(voiceId).delete().catch(console.error),
			])));
		}
		await PureVoice.deleteOne(guildQuery);
		
		const deleteEmbed = wizEmbed(interaction.client.user.avatarURL(), 'Operación finalizada', 'RED')
			.addField('Sistema PuréVoice eliminado', 'Se eliminó el Sistema PuréVoice asociado al servidor');
		return await interaction.update({
			embeds: [deleteEmbed],
			components: [],
		});	
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction 
	 * @param {Array<String>} param1 
	 */
	async ['cancelWizard'](interaction, [ authorId ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const cancelEmbed = wizEmbed(interaction.client.user.avatarURL(), 'Operación abortada', 'NOT_QUITE_BLACK')
			.addField('Asistente cancelado', 'Se canceló la configuración del Sistema PuréVoice');
		return await interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	},
};