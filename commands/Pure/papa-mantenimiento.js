const global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-mantenimiento',
	aliases: [
		'papa-maintenance'
	],
	desc: 'Hace que la instancia de `<proceso>` que utilizo se restrinja al canal actual\n' +
		'Como lo más probable es que este comando se use mientras estoy hosteada en 2 lugares al mismo tiempo, puedes diferenciar un `<proceso>` de otro con una ID única que equivale a la expresión numérica del momento en el que se ejecutó una instancia',
	flags: [
		'papa'
	],
	options: [
		'`<proceso?>` _(id)_ instancia de proceso a restringir'
	],
	callx: '<proceso?>',

	execute(message, args) {
		//Acción de comando
		if(!args.length)
			message.channel.send(`**Host** \`${global.bot_status.host}\`\n**ID de InstProc** \`${global.startuptime}\``);
		else if(args[0] === global.startuptime) {
			global.maintenance = message.channel.id;
			message.react('✅');
		}
	}
};