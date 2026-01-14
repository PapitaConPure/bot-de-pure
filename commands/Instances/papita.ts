import { randRange, isThread } from '../../func';
import { CommandOptions, CommandTags, Command } from '../Commons/';

const paputa = [
	'Romper al bot <:sagumeBlush:1108315844045455410>',
	'¿Qué es "Manzanas contra Bananas"? <:mayuwu:1107843515385389128>',
	'J-jueguen Palactis <:kogaBlush:1108605873326141500>',
	'Meguuuu <:aliceHug:1107848230420623361>',
	'Sagume <:aliceHug:1107848230420623361>',
	'*KONOSUBA!*',
	'*NEKOPARA!*',
	'https://i.imgur.com/HxTxjdL.png',
];

const flags = new CommandTags().add('MEME');
const options = new CommandOptions()
	.addParam('frase', 'TEXT', 'para indicar una frase a patentar', { optional: true });
const command = new Command('papita', flags)
	.setAliases(
		'papa', 'apita', 'ure', 'uré',
		'potato', '🥔',
	)
	.setBriefDescription('Comando de frases de Papita con Puré')
	.setLongDescription(
		'Comando de frases de Papita con Puré. Si se ingresa texto, se lo patentará, si no, dependiendo del canal...',
		'**SFW:** muestra frases y cosas de Papita',
		'**NSFW:** muestra _otra_ frase _tal vez_ de Papita',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const isnsfw = isThread(request.channel)
			? request.channel.parent.nsfw
			: request.channel.nsfw;
		
		const words = args.getString('frase')?.split(/[ \n]+/);
		if(words?.length) {
			const newmsg = `***:copyright: ${words.shift()}:registered: ${words.join(' ').replace(/[a-zA-Z0-9áéíóúÁÉÍÓÚüÑñ;:]+/g, '$&:tm:')}***`;
			return request.reply({ content: newmsg });
		}

		if(isnsfw)
			return request.reply({ content: 'https://www.youtube.com/watch?v=pwEvEY-7p9o' });
		else 
			return request.reply({ content: `**${paputa[randRange(0, paputa.length)]}**` });
	});

export default command;
