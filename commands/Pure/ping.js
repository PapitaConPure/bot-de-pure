const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('ping', flags)
	.setLongDescription('Muestra el tiempo de respuesta del Bot y la API')
	.setExecution(async (request, _, __) => {
		const rtime = Date.now() - request.createdTimestamp;

		return request.reply({
			content:
				'Pong~♪\n' +
				`**Tiempo de respuesta** ${Math.max(1, rtime)}ms\n` +
				`**Latencia de la API** ${Math.round(request.client.ws.ping)}ms`
		});
	});

module.exports = command;