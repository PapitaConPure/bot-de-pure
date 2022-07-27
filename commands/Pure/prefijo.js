const global = require('../../localdata/config.json');
const { shortenText } = require('../../func.js');
const PrefixPair = require('../../localdata/models/prefixpair.js');
const prefixes = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('COMMON', 'MOD');
const options = new CommandOptionsManager()
	.addParam('prefijo', 'TEXT', 'para cambiar el prefijo del servidor', { optional: true })
	.addFlag('d', 'drawmaku', 'para cambiar o ver el prefijo de Drawmaku')
	.addFlag('r', ['reestablecer', 'reiniciar', 'reset'], 'para volver al prefijo por defecto');

const command = new CommandManager('prefijo', flags)
	.setAliases('prefix', 'pf')
	.setLongDescription('Cambia o muestra el prefijo del servidor actual')
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		//Acción de comando
		const target = options.fetchFlag(args, 'drawmaku', { callback: 'drmk', fallback: 'pure' });
		const reset = options.fetchFlag(args, 'reestablecer', { callback: true });
		const guildsearch = { guildId: request.guildId };
		const { raw: preraw, regex: preregex } = prefixes[`p_${target}`](request.guildId);

		if(reset) {
			await PrefixPair.findOneAndRemove(guildsearch);
			global[`p_${target}`][request.guildId] = null;
			return request.reply({
				content:
					'Prefijo reestablecido a la configuración por defecto.\n' +
					`\`${global[`p_${target}`]['0'].raw}\` <:arrowl:681963688361590897> \`${preraw}\``,
			});
		}

		const prefix = (isSlash ? args.getString('prefijo') : args[0])?.toLowerCase();

		if(!prefix)
			return request.reply({
				content: [
					`El prefijo actual es **${preraw}**`,
					`Usa \`${preraw}ayuda\` para más información`,
					`||Expresión Regular (avanzado): \`${shortenText(preregex.toString(), 500)}\`||`,
				].join('\n')
			});
		
		await PrefixPair.findOneAndRemove(guildsearch);
		const pfpair = (await PrefixPair.findOne(guildsearch)) || new PrefixPair(guildsearch);
		const regex = new RegExp(`^${prefix.replace(/[a-z]/g, l => `[${l.toUpperCase()}${l}]`).replace('\\', '\\\\')}[\n ]*`);
		global[`p_${target}`][request.guildId] = {
			raw: pfpair[target].raw = prefix,
			regex: pfpair[target].regex = regex,
		};
		await pfpair.save();
		return request.reply({
			content: [
				'Prefijo cambiado',
				`\`${preraw}\` <:arrowr:681963688411922460> \`${pfpair[target].raw}\``,
				`||Expresión Regular (avanzado): \`${shortenText(regex.toString(), 500)}\`||`,
			].join('\n')
		});
	});

module.exports = command;