const { EmbedBuilder } = require('discord.js');
const { tenshiColor } = require('../../data/config.json');
const { CommandTags, Command, CommandOptions, CommandOptionSolver } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const options = new CommandOptions()
	.addParam('anuncio', 'TEXT', 'para anunciar algo a todos los servers posibles')
	.addFlag('tn', 'título', 'para especificar un título', { name: 'ttl', type: 'TEXT' });
const command = new Command('papa-anunciar', flags)
	.setAliases(
		'papa-anuncio', 'papa-actualización', 'papa-actualizacion',
		'papa-announcement', 'papa-update',
	)
	.setDescription('Da un anuncio a todos los canales de sistema posibles')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const title = CommandOptionSolver.asString(args.parseFlagExpr('título'));
		const announcement = args.getString('anuncio', true);
		const guilds = request.client.guilds.cache;
		guilds.forEach(guild => {
			const embed = new EmbedBuilder()
				.setColor(tenshiColor)
				.setTitle('📣 Anuncio de Actualización')
				.setAuthor({ name: guild.members.me.displayName ?? request.client.user.username, iconURL: request.client.user.avatarURL({ size: 256 }) })
				.setFooter({ text: 'Bot de Puré está en desarrollo por Papita con Puré#6932' })
				.addFields({
					name: title ?? 'Mensaje de Papita con Puré',
					value: announcement,
				});

			guild.systemChannel?.send({ embeds: [embed] }).catch(console.error);
		});
	});

module.exports = command;