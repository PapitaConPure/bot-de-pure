const uses = require('../../localdata/sguses.json'); //Funciones globales
const { fetchUser, randRange } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
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
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		const now = Date.now() * 1;
		const uid = (request.author ?? request.user).id;
		if(now - (uses.pinguear[uid] ?? 0) < 1000 * 60)
			return request.react('⏳');
		if(!isSlash && args.length < 2)
			return request.reply({ content: `:warning: Debes ingresar 2 parámetros (\`${p_pure(request.guild.id).raw}pinguear <cantidad> <usuario>\`)`, ephemeral: true });
		
		let repeats = -1;
		let userSearch;
		
		if(isSlash) repeats = Math.floor(args.getNumber('cantidad'));
		else {
			if(!isNaN(args[0])) { repeats = args[0]; userSearch = args[1]; }
			else if(!isNaN(args[1])) { repeats = args[1]; userSearch = args[0]; }
		}
		if(repeats < 2 || repeats > 10)
			return request.reply({ content: ':warning: Solo puedes pinguear a alguien entre 2 y 10 veces', ephemeral: true });

		const user = isSlash ? args.getUser('usuario') : fetchUser(userSearch, request);
		if(!user)
			return request.reply({ content: ':warning: Usuario inválido', ephemeral: true });

		uses.pinguear[uid] = now * 1;
		if(isSlash) await request.reply({ content: `🤡 Tirando pings a **${user.tag}**`, ephemeral: true });
		return pinguear(request.channel, user, repeats);
    },
};