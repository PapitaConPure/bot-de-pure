const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saki } = require('../../data/sakiProps');
const { CommandOptions, CommandTags, Command } = require('../Commons/');
const { CommandPermissions } = require('../Commons/cmdPerms');
const { makeButtonRowBuilder } = require('../../utils/tsCasts');

const hangedDollId = saki.hangedRoleId;

const perms = new CommandPermissions('ManageRoles');
const options = new CommandOptions()
	.addParam('miembro', 'MEMBER', 'para aplicar Hanged Doll a un miembro', { optional: true })
	.addFlag('t', 'todos', 'para aplicar Hanged Doll a todos los usuarios');
const tags = new CommandTags().add('MOD', 'SAKI');
const command = new Command('colgar', tags)
	.setAliases(
		'castrar', 'colgate',
		'hang', 'hanged',
	)
	.setBriefDescription('Cuelga o descuelga al miembro especificado')
	.setLongDescription(
		'Asigna el rol de __Hanged Doll__ al `miembro` especificado.',
		'Usarlo con alguien que ya está colgado lo descolgará, así que cuidado',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const user = request.user;
		const everyone = args.hasFlag('todos');

		if(everyone) {
			const embed = new EmbedBuilder()
				.setTitle('Colgar a todos')
				.addFields({ name: 'Confirmar operación', value: '¿Quieres colgar o descolgar a todos?' });
			return request.reply({
				embeds: [embed],
				components: [makeButtonRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId(`colgar_addHanged_${user.id}`)
						.setLabel('Colgar')
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId(`colgar_removeHanged_${user.id}`)
						.setLabel('Descolgar')
						.setStyle(ButtonStyle.Secondary),
					new ButtonBuilder()
						.setCustomId(`colgar_cancelHanged_${user.id}`)
						.setEmoji('1355143793577426962')
						.setStyle(ButtonStyle.Secondary),
				)],
			});
		}

		const member = await args.getMember('miembro', false);
		if(!member)
			return request.reply({ content: '⚠️ Debes indicar un miembro a colgar (y no, "ESTAAAAAA" no es un miembro válido)', ephemeral: true });

		const wasHanged = !member.roles.cache.has(hangedDollId);
		let err;
		if(wasHanged)
			await member.roles.add(hangedDollId, `Colgado por ${user.tag}`).catch(() => { err = 'Oe oe espérate conchetumare eri muy poderoso wtf' });
		else 
			await member.roles.remove(member.roles.cache.find(r => r.id === hangedDollId)).catch(() => { err = 'wtf dios mío qué está pasando' });

		if(err) return request.reply({ content: err });

		return request.reply({
			content: wasHanged
				? `:moyai: Se ha colgado a **${ member.user.tag }**`
				: `:otter: Se ha descolgado a **${ member.user.tag }**`
		});
	})
	.setButtonResponse(async function addHanged(interaction, userId) {
		if(interaction.user.id !== userId)
			return interaction.reply({ content: '❌ No permitido', ephemeral: true });
		const embed = new EmbedBuilder()
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
			return interaction.reply({ content: '❌ No permitido', ephemeral: true });
		const embed = new EmbedBuilder()
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
			return interaction.reply({ content: '❌ No permitido', ephemeral: true });
		const embed = new EmbedBuilder()
			.setTitle('Colgada en Masa cancelada')
			.addFields({ name: 'Se canceló la operación', value: 'Supongo que van a vivir (o no) un día más' });
		return interaction.update({
			embeds: [embed],
			components: [],
		});
	});

module.exports = command;