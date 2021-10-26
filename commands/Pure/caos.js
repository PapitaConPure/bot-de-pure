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
		'maintenance',
	],
	options,

	async execute(message, args) {
		//Acción de comando
		const activate = fetchFlag(args, { long: ['activar', 'activate', 'on'], callback: true, fallback: false });
		const deactivate = fetchFlag(args, { long: ['desactivar', 'deactivate', 'off'], callback: true });
		const guildsearch = { guildId: message.guild.id };
		const gcfg = (await GuildConfig.findOne(guildsearch)) || new GuildConfig(guildsearch);

		if(activate || deactivate) {
			gcfg.chaos = activate;
			gcfg.markModified('chaos');
			await gcfg.save();
			if(activate)
				message.channel.send({ content: '👹 Se activaron los comandos caóticos' });
			else
				message.channel.send({ content: '😴 Se desactivaron los comandos caóticos' });
		} else {
			const cfiles = readdirSync('./commands/Pure').filter(file => file.endsWith('.js'));
			const chaosnames = [];
			for(const file of cfiles) {
				const command = require(`../../commands/Pure/${file}`);
				if(command.flags.includes('chaos'))
					chaosnames.push(command.name);
			}
			message.channel.send({
				content: `Con este comando, puedes activar un set de comandos que se consideran demasiado caóticos como para estar en un server tranquilito. Usa ${p_pure(message.guild.id).raw}ayuda si quieres saber cómo\n` +
				'Comandos caóticos:\n' +
				'```diff\n' +
				`-> ${chaosnames.join(', ')}\n` +
				'```'
			});
		}
	},
};