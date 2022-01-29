const PureVoice = require('../../localdata/models/purevoice.js');
const { MessageEmbed, MessageActionRow, MessageButton, MessageCollector } = require('discord.js');

const cancelbutton = (id) => new MessageButton()
	.setCustomId(`voz_cancelWizard_${id}`)
	.setLabel('Cancelar')
	.setStyle('SECONDARY');

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
		.setAuthor('Asistente de configuración de Sistema PuréVoice', iconUrl)
		.setFooter(stepName);
};

module.exports = {
	name: 'voz',
	aliases: [
		'purévoz', 'purevoz',
		'purévoice', 'purevoice', 'voice',
	],
	brief: 'Para inyectar un Sistema PureVoice en una categoria por medio de un Asistente',
	desc: 'Para inyectar un Sistema PureVoice en una categoria. Simplemente usa el comando y sigue los pasos del Asistente para configurar todo',
	flags: [,
		'mod',
		'maintenance'
	],
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, [], isSlash = false) {
		//Acción de comando
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
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), '2/? • Seleccionar Operación', 'NAVY')
			.addField('Inyección de Sistema PuréVoice', '¿Qué deseas hacer ahora mismo?');
			
		const pv = await PureVoice.findOne({ guildId: interaction.guild.id });
		const uid = interaction.user.id;
		const row = new MessageActionRow();
		if(!(pv && interaction.guild.channels.cache.some(channel => channel.type === 'GUILD_CATEGORY')))
			row.addComponents(
				new MessageButton()
					.setCustomId(`voz_createSystem_${uid}`)
					.setLabel('Instalar')
					.setStyle('SUCCESS'),
			);
		else 
			row.addComponents(
				new MessageButton()
					.setCustomId(`voz_setSystem_${uid}`)
					.setLabel('Reubicar')
					.setStyle('PRIMARY'),
			);

		row.addComponents(
			new MessageButton()
				.setCustomId(`voz_deleteSystem_${uid}`)
				.setLabel('Desinstalar')
				.setStyle('DANGER')
				.setDisabled(!(pv && interaction.guild.channels.cache.get(pv))),
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
	async ['createSystem'](interaction, [ authorId, overwrite ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const filter = (m) => m.author.id === authorId;
		const systemNameCollector = new MessageCollector(interaction.channel, { filter: filter, time: 1000 * 60 * 2 });
		systemNameCollector.on('collect', async collected => {
			await collected.delete();
			interaction.guild.channels.create(collected.content, { type: 'GUILD_CATEGORY' })
			.then(async channel => {
				//Guardar nueva categoría PuréScript
				const guildQuery = { guildId: interaction.guild.id };
				await PureVoice.deleteOne(guildQuery);
				const pv = new PureVoice({
					...guildQuery,
					categoryId: channel,
				});
				await pv.save();
			})
			.catch(async error => {
				console.error(error);
				return await interaction.channel.send({ content: '⚠ Ocurrió un error al nombrar esta categoría'});
			});
		});
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), '3/3 • Nombrar categoría', 'NAVY')
			.addField('Inyección de Sistema PuréVoice', '¿Qué deseas hacer ahora mismo?');
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
	async ['cancelWizard'](interaction, [ authorId ]) {
		if(interaction.user.id !== authorId)
			return await interaction.reply({ content: ':x: No puedes hacer esto', ephemeral: true });
		
		const cancelEmbed = wizEmbed(interaction.client.user.avatarURL(), 'Operación abortada', 'NOT_QUITE_BLACK')
			.addField('Asistente cancelado', 'Se canceló la configuración de Feed');
		return await interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	},
};