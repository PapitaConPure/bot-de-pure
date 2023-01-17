const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { fetchUserID } = require('../../func');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const hangedDollId = '682629889702363143';

const options = new CommandOptionsManager()
	.addParam('usuario', 'USER', 'para aplicar Hanged Doll a un usuario', { optional: true })
	.addFlag('t', 'todos', 'para aplicar Hanged Doll a todos los usuarios');
const flags = new CommandMetaFlagsManager().add(
	'MOD',
	'HOURAI',
);
const command = new CommandManager('colgar', flags)
	.setAliases(
		'castrar', 'colgate',
		'hang', 'hanged',
	)
	.setBriefDescription('Cuelga o descuelga al miembro especificado')
	.setLongDescription(
		'Asigna el rol de __Hanged Doll__ al `usuario` especificado.',
		'Usarlo con alguien que ya está colgado lo descolgará, así que cuidado',
	)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const { client, guild } = request;
		const user = request.author ?? request.user;
		const everyone = options.fetchFlag(args, 'todos');

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

		if(!args.length)
			return request.reply({ content: '⚠ Debes indicar un usuario', ephemeral: true });

		const member = guild.members.cache.get(fetchUserID(args.join(' '), { guild, client }));
		if(!member) {
			const sent = await request.reply({
				content: ':warning: La gente que no existe por lo general no tiene cuello <:invertido:720736131368485025>',
				ephemeral: true,
				fetchReply: true,
			});
			if(!isSlash) {
				setTimeout(() => sent.deletable && sent.delete().catch(_ => undefined), 1000 * 5);
				return request.delete().catch(_ => undefined);
			}
		}

		let wasHanged;
		wasHanged = !member.roles.cache.has(hangedDollId);
		if(wasHanged)
			await member.roles.add(hangedDollId, `Colgado por ${user.tag}`);
		else 
			await member.roles.remove(member.roles.cache.find(r => r.id === hangedDollId));
		return request.reply({
			content: wasHanged
				? `:moyai: Se ha colgado a **${ member.user.tag }**`
				: `:otter: Se ha descolgado a **${ member.user.tag }**`
		});
	})
	.setButtonResponse(async function addHanged(interaction, userId) {
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
		return Promise.all(interaction.guild.members.cache.filter(member => !member.user.bot).map(member => member.roles.add(hangedDollId, `Colgado por ${interaction.user.tag}`)));
	})
	.setButtonResponse(async function removeHanged(interaction, userId) {
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
			member.roles.cache.has(hangedDollId)
				? member.roles.remove(member.roles.cache.find(r => r.id === hangedDollId))
				: Promise.resolve()
		));
	})
	.setButtonResponse(async function cancelHanged(interaction, userId) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: ':x: No permitido', ephemeral: true });
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa cancelada')
			.addFields({ name: 'Se canceló la operación', value: 'Supongo que van a vivir (o no) un día más' });
		return interaction.update({
			embeds: [embed],
			components: [],
		});
	});

module.exports = command;