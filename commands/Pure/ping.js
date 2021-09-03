module.exports = {
	name: 'ping',
	desc: 'Muestra el tiempo de respuesta del Bot y la API',
	flags: [
		'common'
	],

	async execute(message, args) {
		const rtime = Date.now() - message.createdTimestamp;

		//Acción de comando
		await message.channel.send({
			content:
				'Pong~♪\n' +
				`**Tiempo de respuesta** ${Math.max(1, rtime)}ms\n` +
				`**Latencia de la API** ${Math.round(message.client.ws.ping)}ms`
		});
	},

	async interact(interaction) {
		const rtime = Date.now() - interaction.createdTimestamp;
		//Acción de comando
		await interaction.reply({
			content:
				'Pong~♪\n' +
				`**Tiempo de respuesta** ${Math.max(1, rtime)}ms\n` +
				`**Latencia de la API** ${Math.round(interaction.client.ws.ping)}ms`
		});
	}
};