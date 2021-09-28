const global = require('../../localdata/config.json');
const { fetchFlag } = require('../../func.js');
const PrefixPair = require('../../localdata/models/prefixpair.js');

module.exports = {
	name: 'prefijo',
	aliases: [
		'prefix',
		'pf'
	],
	desc: 'Cambia o muestra el prefijo del servidor actual',
	flags: [
		'common'
	],
	options: [
		'`<prefijo?>` _(texto)_ para cambiar el prefijo del servidor',
		'`-d` o `--drawmaku` para cambiar o ver el prefijo de Drawmaku'
	],
	callx: '<prefijo?>',

	async execute(message, args) {
		//Acción de comando
		const target = fetchFlag(args, { short: ['d'], long: ['drawmaku', 'drmk'], callback: 'drmk', fallback: 'pure' });
		const guildsearch = { guildId: message.guild.id };

		if(args.length) {
			await PrefixPair.findOneAndRemove(guildsearch);
			const pfpair = new PrefixPair(guildsearch);
			const regex = new RegExp(`${args[0]}[\n ]*`);
			global[`p_${target}`][message.guildId] = {
				raw: pfpair[target].raw = args[0],
				regex: pfpair[target].regex = regex
			};
			await pfpair.save();
			message.channel.send(`Prefijo cambiado a \`${pfpair[target].raw}\``);
		} else {
			const pf = global[`p_${target}`][message.guildId].raw;
			message.channel.send(
				`El prefijo actual es **${pf}**\n` +
				`Usa \`${pf}ayuda\` para más información`
			);
		}
		console.log(global.p_pure[message.guildId] || global.p_pure);
	}
};