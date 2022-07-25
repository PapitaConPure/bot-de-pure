const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { fetchFlag, fetchUserID } = require('../../func');
const { CommandOptionsManager, CommandMetaFlagsManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
	.addParam('usuario', 'USER', 'para aplicar Hanged Doll a un usuario', { optional: true })
	.addFlag('t', 'todos', 'para aplicar Hanged Doll a todos los usuarios');

const hd = '682629889702363143'; //Hanged Doll

module.exports = {
	name: 'colgar',
	aliases: [
		'castrar', 'colgate',
		'hang', 'hanged',
	],
	desc: 'Comando de Hourai para asignar rápidamente el rol __Hanged Doll__ a un `usuario`.\n' +
		  'Usarlo con alguien que ya está colgado lo descolgará, así que ten cuidado.',
	flags: new CommandMetaFlagsManager().add(
		'MOD',
		'HOURAI',
	),
	options,
	callx: '<usuario>',
	experimental: true,

	async execute(request, args, isSlash = false) {
		//Acción de comando
		const { client, guild } = request;
		const user = request.author ?? request.user;
		if(!args.length)
			return request.reply({ content: '⚠ Debes indicar un usuario' });

		const everyone = isSlash
			? options.fetchFlag(args, 'todos')
			: fetchFlag(args, { ...options.flags.get('todos').structure, callback: true });
		let wasHanged;

		if(everyone) {
			const embed = new MessageEmbed()
				.setTitle('Colgar a todos')
				.addFields({ name: 'Confirmar operación', value: '¿Quieres colgar o descolgar a todos?' });
			return request.reply({
				embeds: [embed],
				components: [new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(`colgar_addHanged_${user.id}`)
						.setLabel('Colgar')
						.setStyle('DANGER'),
					new MessageButton()
						.setCustomId(`colgar_removeHanged_${user.id}`)
						.setLabel('Descolgar')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(`colgar_cancelHanged_${user.id}`)
						.setLabel('Cancelar')
						.setStyle('SECONDARY'),
				)],
			});
		}

		const member = guild.members.cache.get(fetchUserID(args.join(' '), { guild, client }));
		if(!member) {
			const sent = await request.reply({
				content: ':warning: La gente que no existe por lo general no tiene cuello <:invertido:720736131368485025>',
				ephemeral: true,
			});
			if(!isSlash) {
				setTimeout(() => sent.deletable && sent.delete(), 1000 * 5);
				return request.delete();
			}
		}

		//await message.delete();
		wasHanged = !member.roles.cache.has(hd);
		if(wasHanged)
			await member.roles.add(hd, `Colgado por ${user.tag}`);
		else 
			await member.roles.remove(member.roles.cache.find(r => r.id === hd));
		return request.reply({
			content: wasHanged
				? `:moyai: Se ha colgado a **${ member.user.tag }**`
				: `:otter: Se ha descolgado a **${ member.user.tag }**`
		});
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 */
	async ['addHanged'](interaction, [ userId ]) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: ':x: No permitido', ephemeral: true });
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa ejecutada')
			.setImage('https://i.imgur.com/RVsStid.png')
			.addFields({ name: 'Se colgó a todos los miembros', value: 'Felicidades, Alice' });
		await interaction.update({
			embeds: [embed],
			components: [],
		});
		return Promise.all(interaction.guild.members.cache.filter(member => !member.user.bot).map(member => member.roles.add(hd, `Colgado por ${interaction.user.tag}`)));
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 */
	async ['removeHanged'](interaction, [ userId ]) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: ':x: No permitido', ephemeral: true });
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa deshecha')
			.addFields({ name: 'Se descolgó a todos los miembros', value: 'Si siguen vivos, bien por ellos~' });
		await interaction.update({
			embeds: [embed],
			components: [],
		});
		return Promise.all(interaction.guild.members.cache.filter(member => !member.user.bot).map(member =>
			member.roles.cache.has(hd)
				? member.roles.remove(member.roles.cache.find(r => r.id === hd))
				: Promise.resolve()
		));
	},

	async ['cancelHanged'](interaction, [ userId ]) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: ':x: No permitido', ephemeral: true });
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa cancelada')
			.addFields({ name: 'Se canceló la operación', value: 'Supongo que van a vivir (o no) un día más' });
		return interaction.update({
			embeds: [embed],
			components: [],
		});
	},
};