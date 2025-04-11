const { EmbedBuilder } = require('discord.js');
const global = require('../../localdata/config.json');
const { shortenText } = require('../../func.js');
const PrefixPair = require('../../localdata/models/prefixpair.js');
const prefixes = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');
const { CommandPermissions } = require('../Commons/cmdPerms.js');

const perms = new CommandPermissions('ManageGuild');
const flags = new CommandTags().add(
	'COMMON',
	'MOD',
);
const options = new CommandOptions()
	.addParam('prefijo', 'TEXT', 'para cambiar el prefijo del servidor', { optional: true })
	.addFlag('r', ['reestablecer', 'reiniciar', 'reset'], 'para volver al prefijo por defecto');

const command = new CommandManager('prefijo', flags)
	.setAliases('prefix', 'pf')
	.setLongDescription('Cambia o muestra el prefijo del servidor actual')
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const reset = args.parseFlag('reestablecer');
		const guildsearch = { guildId: request.guildId };
		const { raw: preraw, regex: preregex } = prefixes.p_pure(request.guildId);

		if(reset) {
			await PrefixPair.findOneAndRemove(guildsearch);
			global.p_pure[request.guildId] = null;
			return request.reply({
				content:
					'Prefijo reestablecido a la configuración por defecto.\n' +
					`\`${global.p_pure['0'].raw}\` <:arrowl:681963688361590897> \`${preraw}\``,
			});
		}

		const prefix = args.getString('prefijo');
		if(!prefix) {
			const embed = new EmbedBuilder()
				.setColor(global.tenshiColor)
				.setFooter({ text: `Usa "${preraw}ayuda" para más información` })
				.addFields(
					{
						name: 'Prefijo actual',
						value: preraw,
						inline: true,
					},
					{
						name: 'Patrón (avanzado)',
						value: `\`\`\`\n${shortenText(preregex.toString(), 500)}\n\`\`\``,
						inline: true,
					},
				);
			
			return request.reply({ embeds: [embed] });
		}
		
		await PrefixPair.findOneAndRemove(guildsearch);
		const pfpair = (await PrefixPair.findOne(guildsearch)) || new PrefixPair(guildsearch);
		const regex = new RegExp(`^${prefix.replace(/[a-z]/g, l => `[${l.toUpperCase()}${l}]`).replace('\\', '\\\\')}[\n ]*`);
		global.p_pure[request.guildId] = {
			raw: pfpair.pure.raw = prefix,
			regex: pfpair.pure.regex = regex,
		};
		await pfpair.save();
		return request.reply({
			content: [
				'Prefijo cambiado',
				`\`${preraw}\` <:arrowr:681963688411922460> \`${pfpair.pure.raw}\``,
				`||Expresión Regular (avanzado): \`${shortenText(regex.toString(), 500)}\`||`,
			].join('\n')
		});
	});

module.exports = command;
