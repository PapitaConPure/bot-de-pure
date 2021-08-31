module.exports = {
	name: 'ping',
	desc: 'Recibir tiempo de respuesta del Bot y de la API',
	flags: [
		'common'
	],

	async execute(message, args) {
		const rtime = Date.now() - message.createdTimestamp;
		//Acción de comando
		message.channel.send({
			content:
				'Pong~♪\n' +
				`**Tiempo de respuesta** ${Math.max(1, rtime)}ms\n` +
				`**Latencia de la API** ${Math.round(message.client.ws.ping)}ms`
		});
	}
};