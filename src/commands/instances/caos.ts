import { EmbedBuilder } from 'discord.js';
import GuildConfig from '@/models/guildconfigs.js';
import { p_pure } from '@/utils/prefixes';
import { CommandPermissions } from '../commons/cmdPerms.js';
import { Command, CommandOptions, CommandTags, fetchCommandsFromFiles } from '../commons/index.js';

const perms = CommandPermissions.adminOnly();
const options = new CommandOptions()
	.addFlag([], ['activar', 'activate', 'on'], 'para activar los comandos caóticos del servidor')
	.addFlag(
		[],
		['desactivar', 'deactivate', 'off'],
		'para desactivar los comandos caóticos del servidor',
	);

const tags = new CommandTags().add('MOD');

const command = new Command('caos', tags)
	.setAliases('chaos')
	.setLongDescription('Para activar o desactivar comandos caóticos en un servidor')
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const activate = args.hasFlag('activar');
		const deactivate = args.hasFlag('desactivar');
		const guildsearch = { guildId: request.guild.id };
		const gcfg = (await GuildConfig.findOne(guildsearch)) || new GuildConfig(guildsearch);

		if (activate && deactivate)
			return request.reply({
				content: '⚠️️ Elige solo una de las banderas de activación',
				ephemeral: true,
			});

		if (activate || deactivate) {
			gcfg.chaos = activate;
			gcfg.markModified('chaos');
			await gcfg.save();
			if (activate)
				return request.reply({ content: '👹 Se activaron los comandos caóticos' });
			return request.reply({ content: '😴 Se desactivaron los comandos caóticos' });
		}

		const chaosCommands = await fetchCommandsFromFiles({ includeTags: 'CHAOS' });
		const chaosnames = chaosCommands.map((c) => c.name);

		const embed = new EmbedBuilder()
			.setColor(0xb8322c)
			.setDescription(
				[
					'Con este comando, puedes activar un set de comandos que se consideran demasiado caóticos como para estar en un server tranquilito.',
					`Usa \`${p_pure(request.guild.id).raw}ayuda caos\` si quieres saber cómo.`,
				].join('\n'),
			)
			.addFields(
				{
					name: 'Estado actual',
					value: `Los comandos caóticos están ${gcfg.chaos ? 'activados' : 'desactivados'}`,
				},
				{
					name: 'Comandos caóticos',
					value: ['```diff', `-> ${chaosnames.join(', ')}\n`, '```'].join('\n'),
				},
			);

		return request.reply({
			embeds: [embed],
			ephemeral: true,
		});
	});

export default command;
