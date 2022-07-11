const { randRange } = require('../../func');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
	.addParam('frase', 'TEXT', 'para indicar una frase a patentar', { optional: true });

module.exports = {
	name: 'papita',
	aliases: [
        'papa', 'apita', 'ure', 'uré',
		'potato', 'p', '🥔'
    ],
	brief: 'Comando de frases de Papita con Puré',
    desc: 'Comando de frases de Papita con Puré. Si se ingresa texto, se lo patentará, si no, dependiendo del canal...\n' +
		'**SFW:** muestra frases y cosas de Papita\n' +
		'**NSFW:** muestra _otra_ frase _tal vez_ de Papita',
    flags: [
        'meme'
    ],
    options,
	callx: '<frase?>',
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Saber si el canal/thread es NSFW o perteneciente a un canal NSFW
		const isnsfw = request.channel.isThread()
			? request.channel.parent.nsfw
			: request.channel.nsfw;
		
		if((args.data ?? args).length) {
			const words = isSlash ? args.getString('frase').split(/[ \n]+/) : args;
			const newmsg = `***:copyright: ${words.shift()}:registered: ${words.join(' ').replace(/[a-zA-Z0-9áéíóúÁÉÍÓÚüÑñ;:]+/g, '$&:tm:')}***`;
			return request.reply({ content: newmsg });
		}
		if(isnsfw) return request.reply({ content: 'https://www.youtube.com/watch?v=pwEvEY-7p9o' });
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

			return request.reply({ content: `**${paputa[randRange(0, paputa.length)]}**` });
		}
    },
};