const global = require('../../localdata/config.json');
const { fetchFlag } = require('../../func.js');
const PrefixPair = require('../../localdata/models/prefixpair.js');
const prefixget = require('../../localdata/prefixget.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts');
const { request } = require('parse/lib/browser/RESTController');

const options = new CommandOptionsManager()
	.addParam('prefijo', 'TEXT', 'para cambiar el prefijo del servidor', { optional: true })
	.addFlag('d', 'drawmaku', 'para cambiar o ver el prefijo de Drawmaku')
	.addFlag('r', ['reestablecer', 'reiniciar', 'reset'], 'para volver al prefijo por defecto');

module.exports = {
	name: 'prefijo',
	aliases: [
		'prefix',
		'pf'
	],
	desc: 'Cambia o muestra el prefijo del servidor actual',
	flags: [
		'common',
		'mod'
	],
	options,
	callx: '<prefijo?>',

	async execute(message, args) {
		//Acción de comando
		const target = fetchFlag(args, { short: ['d'], long: ['drawmaku', 'drmk'], callback: 'drmk', fallback: 'pure' });
		const reset = fetchFlag(args, { short: ['r'], long: ['reestablecer', 'reiniciar', 'reset'], callback: true });
		const guildsearch = { guildId: message.guild.id };
		const { raw: preraw, regex: preregex } = prefixget[`p_${target}`](message.guildId);

		if(reset) {
			message.channel.send({
				content:
					'Prefijo reestablecido a la configuración por defecto.\n' +
					`\`${global[`p_${target}`]['0'].raw}\` <:arrowl:681963688361590897> \`${preraw}\``
			});
			await PrefixPair.findOneAndRemove(guildsearch);
			global[`p_${target}`][message.guildId] = null;
			return;
		}

		if(args.length) {
			await PrefixPair.findOneAndRemove(guildsearch);
			const pfpair = new PrefixPair(guildsearch);
			const prefix = args[0].toLowerCase();
			const regex = new RegExp(`^${prefix.replace(/[a-z]/g, l => `[${l.toUpperCase()}${l}]`).replace('\\', '\\\\')}[\n ]*`);
			global[`p_${target}`][message.guildId] = {
				raw: pfpair[target].raw = prefix,
				regex: pfpair[target].regex = regex
			};
			await pfpair.save();
			message.channel.send({
				content: [
					'Prefijo cambiado',
					`\`${preraw}\` <:arrowr:681963688411922460> \`${pfpair[target].raw}\``,
					`||Expresión Regular (avanzado): \`${regex}\`||`,
				].join('\n')
			});
		} else
			return await message.reply({
				content: [
					`El prefijo actual es **${preraw}**`,
					`Usa \`${preraw}ayuda\` para más información`,
					`||Expresión Regular (avanzado): \`${preregex}\`||`,
				].join('\n')
			});
	}
};