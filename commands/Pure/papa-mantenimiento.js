const global = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'papa-mantenimiento',
	aliases: [
		'papa-maintenance',
		'papa-mant', 'papa-maint'
	],
	desc: 'Hace que la instancia de `<proceso>` que utilizo se restrinja al canal actual\n' +
		'Como lo más probable es que este comando se use mientras estoy hosteada en 2 lugares al mismo tiempo, puedes diferenciar un `<proceso>` de otro por su ubicación de host o con una ID única que equivale a la expresión numérica del momento en el que se ejecutó\n' +
		'Para deshacer la restricción, usa el comando sin argumentos una vez más (en el canal que se estableción la restricción)',
	flags: [
		'papa'
	],
	callx: '<proceso?>',

	async execute({ channel, author }, _) {
		//Acción de comando
		const sent = await channel.send({ content: `**Host** \`${global.bot_status.host}\`\n**ID de InstProc** \`${global.startuptime}\`\n**Estado** \`[${global.maintenance.length?'PAUSADO':'OPERANDO'}]\``})

		const reaction = (global.maintenance.length)?'🌀':'💤';
		sent.react(reaction);
		const filter = (rc, user) => rc.emoji.name === reaction && user.id === author.id;
		const collector = sent.createReactionCollector({ filter: filter, max: 1, time: 1000 * 30 });
		collector.on('collect', () => {
			if(global.maintenance.length) {
				global.maintenance = '';
				sent.react('☑️');
			} else {
				global.maintenance = channel.id;
				sent.react('✅');
			}
		});
	}
};