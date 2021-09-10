const Discord = require('discord.js'); //Integrar discord.js
const { randRange } = require('../../func');
var global = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'papita',
	aliases: [
        'papa', 'apita', 'ure', 'uré',
		'potato', 'p'
    ],
    desc: 'Comando de frases de Papita con Puré. Si se ingresa texto, se lo patentará, sino, dependiendo del canal...\n' +
		'**SFW:** muestra frases y cosas de Papita\n' +
		'**NSFW:** muestra _otra_ frase _tal vez_ de Papita',
    flags: [
        'meme'
    ],
    options: [
		'`<frase?>` _(texto)_ para indicar una frase a patentar'
    ],
	callx: '<frase?>',
	
	async execute(message, args) {
		//Saber si el canal/thread es NSFW o perteneciente a un canal NSFW
		const isnsfw = message.channel.isThread()
			? message.channel.parent.nsfw
			: message.channel.nsfw;
		
		if(args.length) {
			const newmsg = `***:copyright: ${args.shift()}:registered: ${args.join(' ').replace(/[a-zA-Z0-9áéíóúÁÉÍÓÚüÑñ;:]+/g, '$&:tm:')}***`;
			message.channel.send({ content: newmsg });
		} else {
			if(isnsfw) message.channel.send({ content: 'https://www.youtube.com/watch?v=pwEvEY-7p9o' });
			else {
				const paputa = [
					'Lechita:tm: uwu :milk:',
					'Romper al bot <:lewdsen:660217470635737088>',
					'¿Qué es "Manzanas contra Bananas"? <:mayuwu:654489124413374474>',
					'J-j-jueguen Palactis <:kogablush:654504689873977347>',
					'Meguuuu <:aliceHug:684625280991756312>',
					'Sagume <:aliceHug:684625280991756312>',
					'*KONOSUBA!*',
					'*NEKOPARA!*',
					'https://i.imgur.com/HxTxjdL.png'
				];

				message.channel.send({ content: `**${paputa[randRange(0, paputa.length)]}**` });
			}
		}
    },
};