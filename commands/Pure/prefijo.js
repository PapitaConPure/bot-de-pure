const global = require('../../localdata/config.json');
const { fetchFlag } = require('../../func.js');
const PrefixPair = require('../../localdata/models/prefixpair.js');
const prefixget = require('../../localdata/prefixget.js');

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
	options: [
		'`<prefijo?>` _(texto)_ para cambiar el prefijo del servidor',
		'`-d` o `--drawmaku` para cambiar o ver el prefijo de Drawmaku',
		'`-r` o `--reestablecer` para volver al prefijo por defecto'
	],
	callx: '<prefijo?>',

	async execute(message, args) {
		//Acción de comando
		const target = fetchFlag(args, { short: ['d'], long: ['drawmaku', 'drmk'], callback: 'drmk', fallback: 'pure' });
		const reset = fetchFlag(args, { short: ['r'], long: ['reestablecer', 'reiniciar', 'reset'], callback: true });
		const guildsearch = { guildId: message.guild.id };
		const prepf = prefixget[`p_${target}`](message.guildId).raw;

		if(reset) {
			message.channel.send({
				content:
					'Prefijo reestablecido a la configuración por defecto.\n' +
					`\`${global.p_pure.raw}\` <:arrowl:681963688361590897> \`${prepf}\``
				});
			await PrefixPair.findOneAndRemove(guildsearch);
			global[`p_${target}`][message.guildId] = null;
			return;
		}

		if(args.length) {
			await PrefixPair.findOneAndRemove(guildsearch);
			const pfpair = new PrefixPair(guildsearch);
			const regex = new RegExp(`${args[0]}[\n ]*`);
			global[`p_${target}`][message.guildId] = {
				raw: pfpair[target].raw = args[0],
				regex: pfpair[target].regex = regex
			};
			await pfpair.save();
			message.channel.send({
				content:
					'Prefijo cambiado\n' +
					`\`${prepf}\` <:arrowr:681963688411922460> \`${pfpair[target].raw}\``
			});
		} else {
			message.channel.send(
				`El prefijo actual es **${prepf}**\n` +
				`Usa \`${prepf}ayuda\` para más información`
			);
		}
	}
};