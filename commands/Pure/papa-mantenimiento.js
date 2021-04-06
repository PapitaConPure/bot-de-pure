const global = require('../../config.json'); //Variables globales
const dns = require('dns'); //Detectar host

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
		dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
			const phostname = (err === null)?`${service}://${hostname}/`:'[host no detectado]';

			if(!args.length)
				message.channel.send(`**Host** \`${phostname}\`\n**ID de InstProc** \`${global.startuptime}\``);
			else if(args[0] === global.startuptime) {
				global.maintenance = message.channel.id;
				message.react('✅');
			}
		});
	}
};