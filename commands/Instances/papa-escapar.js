const { CommandTags, Command, CommandOptions } = require('../Commons/commands');

const options = new CommandOptions()
	.addParam('servidor', 'GUILD', 'para indicar un servidor');

const flags = new CommandTags().add('PAPA');
const command = new Command('papa-escapar', flags)
	.setAliases('papa-abandonar')
	.setDescription('Me hace abandonar el servidor especificado.')
	.setOptions(options)
	.setExecution(async (request, args) => {
		if(args.empty)
			return request.reply({ content: request.client.guilds.cache.map(g => `**${g.name}** ${g.id}`).join('\n') });

		const guild = await args.getGuild('servidor');
		if(!guild)
			return request.reply({ content: '⚠️ Servidor inválido' });

		return guild.leave();
	});

module.exports = command;
