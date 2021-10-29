const uses = require('../../localdata/sguses.json'); //Funciones globales
const { fetchUser, randRange } = require('../../func.js');
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const frase = [
	'Oe po [m] <:junkNo:697321858407727224>',
	'Wacho, cachai[m] <:yumou:708158159180660748>',
	'Oe [m] qliao <:miyoi:674823039086624808>',
	'Responde po [m] <:mayuwu:654489124413374474>',
	'¿Vai a responder [m]? <:haniwaSmile:659872119995498507>',
	'[m], respondé altoke <:hypergardener:796931141851938827>',
	'Dale [m] ctm <:reibu:686220828773318663>',
	'Wena po [m] como andai <:meguSmile:694324892073721887>',
	'Pero qué andai haciendo po [m] rectm <:spookedSyura:725577379665281094>',
	'NoOoOoOo re TUuUrBiOoOoOo, veni [m] <:junkWTF:796930821260836864>'
];

async function pinguear(channel, user, cnt) {
	await channel.send({ content: frase[randRange(0, frase.length)].replace('[m]', `${user}`) });

	if(cnt > 1) setTimeout(pinguear, 800, channel, user, cnt - 1);
	else uses.pinguear[user.id] = false;
}

const options = new CommandOptionsManager()
	.addParam('cantidad', 'NUMBER', 'para indicar la cantidad de veces que se debe pinguear')
	.addParam('usuario', 'USER', 'para indicar el usuario a pinguear');

module.exports = {
	name: 'pinguear',
	aliases: [
        'pingear', 'pingeara', 'pingueara',
		'pingsomeone'
    ],
    desc: 'Pingea a un `<usuario>` una `<cantidad>` de veces',
    flags: [
        'meme',
		'chaos',
    ],
    options,
	callx: '<cantidad> <usuario>',
	
	async execute(message, args) {
		if(uses.pinguear[message.author.id] !== undefined && uses.pinguear[message.author.id]) {
			message.react('⏳');
			return;
		}
		if(args.length !== 2) {
			message.channel.send({ content: `:warning: Debes ingresar 2 parámetros (\`${p_pure(message.guildId).raw}pinguear <cantidad> <usuario>\`)` });
			return;
		}
		let cnt = -1;
		let usrc;
		
		if(!isNaN(args[0])) { cnt = args[0]; usrc = args[1]; }
		else if(!isNaN(args[1])) { cnt = args[1]; usrc = args[0]; }
		if(cnt < 2 || cnt > 10) {
			message.channel.send({ content: ':warning: Solo puedes pinguear a alguien entre 2 y 10 veces' });
			return;
		}

		const user = fetchUser(usrc, message);

		if(user === undefined) {
			message.channel.send({ content: ':warning: Usuario inválido' });
			return;
		}

		uses.pinguear[message.author.id] = true;
		pinguear(message.channel, user, cnt);
    },
};