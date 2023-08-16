const { EmbedBuilder, Colors } = require('discord.js');
const { regroupText, randRange } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
	.addParam('opciones', 'TEXT', 'para asignar una opción elegible', { poly: 'MULTIPLE', polymax: 20 });
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('elegir', flags)
	.setAliases('choose')
	.setLongDescription('Elige una de las opciones que hayas especificado, puedes separar opciones con comas')
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const choices = isSlash
			? options.fetchParamPoly(args, 'opciones', args.getString)
			: regroupText(args);
		
		if(!choices.length || choices.length < 2)
			return request.reply({
				content: `⚠️️ Debes ingresar al menos dos opciones separadas por comas ","\nUsa \`${p_pure(request.guild.id).raw}ayuda\` para más información`,
				ephemeral: true,
			});
		
		const embed = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.addFields({ name: 'Yo digo que...', value: `_"${choices[randRange(0, choices.length)]}"_` });
		return request.reply({ embeds: [embed] });
	});

module.exports = command;