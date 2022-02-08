const { readdirSync } = require('fs'); //Integrar operaciones sistema de archivos de consola
const { fetchFlag } = require('../../func.js');
const GuildConfig = require('../../localdata/models/guildconfigs.js');
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
	.addFlag([], ['activar', 'activate', 'on'],    'para activar los comandos caóticos del servidor')
	.addFlag([], ['desactivar', 'deactivate', 'off'], 'para desactivar los comandos caóticos del servidor');

module.exports = {
	name: 'caos',
	aliases: [
		'chaos'
	],
	desc: 'Para activar o desactivar comandos caóticos en un servidor',
	flags: [
		'mod',
	],
	options,
	experimental: true,

	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		const fbactivate = { callback: true, fallback: false };
		const activate = isSlash ? options.fetchFlag(args, 'activar', fbactivate) : fetchFlag(args, { ...options.flags.get('activar').structure, ...fbactivate });
		const deactivate = isSlash ? options.fetchFlag(args, 'desactivar', { callback: true }) : fetchFlag(args, { ...options.flags.get('desactivar').structure, callback: true });
		const guildsearch = { guildId: request.guild.id };
		const gcfg = (await GuildConfig.findOne(guildsearch)) || new GuildConfig(guildsearch);

		if(activate && deactivate) {
			request.reply({ content: '⚠️ Elige solo una de las banderas de activación', ephemeral: true });
			return;
		}

		if(activate || deactivate) {
			gcfg.chaos = activate;
			gcfg.markModified('chaos');
			await gcfg.save();
			if(activate)
				return await request.reply({ content: '👹 Se activaron los comandos caóticos' });
			else
				return await request.reply({ content: '😴 Se desactivaron los comandos caóticos' });
		}

		const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
		const chaosnames = [];
		for(const file of cfiles) {
			const command = require(`../../commands/Pure/${file}`);
			if(command.flags.includes('chaos'))
				chaosnames.push(command.name);
		}
		return await request.reply({
			content:
				`Con este comando, puedes activar un set de comandos que se consideran demasiado caóticos como para estar en un server tranquilito.\nUsa \`${p_pure(request.guild.id).raw}ayuda caos\` si quieres saber cómo.\n` +
				'Comandos caóticos:\n' +
				'```diff\n' +
				`-> ${chaosnames.join(', ')}\n` +
				'```',
			ephemeral: true,
		});
	},
};