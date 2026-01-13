const { EmbedBuilder, Colors } = require('discord.js');
const { randRange } = require('../../func');
const { CommandOptions, CommandTags, Command, CommandOptionSolver } = require('../Commons/');

const options = new CommandOptions()
	.addParam('opciones', 'TEXT', 'para asignar una opción elegible', { poly: 'MULTIPLE', polymax: 20 });
	
const flags = new CommandTags().add('COMMON');

const command = new Command('elegir', flags)
	.setAliases('choose')
	.setLongDescription('Elige una de las opciones que hayas especificado, puedes separar opciones con comas')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const choices = CommandOptionSolver.asStrings(args.parsePolyParamSync('opciones'));
		
		if(choices.length < 2)
			return request.reply({
				content: `⚠️️ Debes ingresar al menos dos opciones separadas por comas`,
				ephemeral: true,
			});
		
		const embed = new EmbedBuilder()
			.setColor(Colors.Greyple)
			.addFields({ name: 'Yo digo que...', value: `_“${choices[randRange(0, choices.length)]}”_` });
			
		return request.reply({ embeds: [embed] });
	});

module.exports = command;
