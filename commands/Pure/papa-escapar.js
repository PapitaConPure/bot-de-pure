const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-escapar', flags)
	.setAliases('papa-abandonar')
	.setDescription('Abandono.')
	.setExecution(async (request, args) => {
		//Acción de comando
		if(!args.length) return request.reply({ content: request.client.guilds.cache.map(g => `**${g.name}** ${g.id}`).join('\n') });
		const search = args.join(' ');
		let guild = request.client.guilds.cache.get(search);
		if(!guild) guild = request.client.guilds.cache.find(g => g.name.toLowerCase().indexOf(search.toLowerCase()) !== -1);
		if(!guild) return request.reply({ content: 'Servidor inválido' });

		return guild.leave();
	});

module.exports = command;