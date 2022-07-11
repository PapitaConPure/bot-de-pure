const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { fetchFlag, fetchUserID } = require('../../func');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

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
	flags: [
		'mod',
		'hourai'
	],
	options,
	callx: '<usuario>',

	async execute(request, args) {
		//Acción de comando
		const { client, guild, channel } = request;
		if(!args.length) {
			channel.send({ content: ':warning: Debes indicar un usuario.' });
			return;
		}

		const everyone = fetchFlag(args, { short: ['t'], long: ['todos'], callback: true });
		let wasHanged;

		if(everyone) {
			const embed = new MessageEmbed()
				.setTitle('Colgar a todos')
				.addField('Confirmar operación', '¿Quieres colgar o descolgar a todos?');
			module.exports.memoAuthorId = request.author.id;
			await channel.send({
				embeds: [embed],
				components: [new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId('colgar_addHanged')
						.setLabel('Colgar')
						.setStyle('DANGER'),
					new MessageButton()
						.setCustomId('colgar_removeHanged')
						.setLabel('Descolgar')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId('colgar_cancelHanged')
						.setLabel('Cancelar')
						.setStyle('SECONDARY'),
				)],
			});
		} else {
			const member = guild.members.cache.get(fetchUserID(args.join(' '), { guild: guild, client: client }));
			if(!member) {
				request.delete();
				const sent = await channel.send({ content: ':warning: La gente que no existe por lo general no tiene cuello <:invertido:720736131368485025>' });
				setTimeout(() => sent.delete(), 1000 * 5);
				return;
			}

			//await message.delete();
			wasHanged = !member.roles.cache.has(hd);
			if(wasHanged)
				await member.roles.add(hd, `Colgado por ${request.author.tag}`);
			else 
				await member.roles.remove(member.roles.cache.find(r => r.id === hd));
			channel.send({
				content: wasHanged
					? `:moyai: Se ha colgado a **${ member.user.tag }**`
					: `:otter: Se ha descolgado a **${ member.user.tag }**`
			});
		}
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 */
	async ['addHanged'](interaction) {
		if(interaction.user.id !== module.exports.memoAuthorId) {
			interaction.reply({ content: ':x: No permitido', ephemeral: true });
			return;
		}
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa ejecutada')
			.setImage('https://i.imgur.com/RVsStid.png')
			.addField('Se colgó a todos los miembros', 'Felicidades, Alice');
		await interaction.update({
			embeds: [embed],
			components: [],
		});
		return Promise.all(interaction.guild.members.cache.filter(member => !member.user.bot).map(member => member.roles.add(hd, `Colgado por ${interaction.user.tag}`)));
	},

	/**
	 * @param {import('discord.js').ButtonInteraction} interaction
	 */
	async ['removeHanged'](interaction) {
		if(interaction.user.id !== module.exports.memoAuthorId) {
			interaction.reply({ content: ':x: No permitido', ephemeral: true });
			return;
		}
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa deshecha')
			.addField('Se descolgó a todos los miembros', 'Si siguen vivos, bien por ellos~');
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

	async ['cancelHanged'](interaction) {
		if(interaction.user.id !== module.exports.memoAuthorId) {
			interaction.reply({ content: ':x: No permitido', ephemeral: true });
			return;
		}
		const embed = new MessageEmbed()
			.setTitle('Colgada en Masa cancelada')
			.addField('Se canceló la operación', 'Supongo que van a vivir (o no) un día más');
		return interaction.update({
			embeds: [embed],
			components: [],
		});
	},
};