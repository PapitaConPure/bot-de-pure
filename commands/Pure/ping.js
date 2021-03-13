module.exports = {
	name: 'ping',
	desc: 'Recibir tiempo de respuesta del Bot y de la API',
	flags: [
		'common'
	],

	execute(message, args) {
		//Acción de comando
		message.channel.send(
			'Pong~♪\n' +
			`**Tiempo de respuesta** ${Date.now() - message.createdTimestamp}ms\n` +
			`**Latencia de la API** ${Math.round(message.client.ws.ping)}ms`
		);
	}
};