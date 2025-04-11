const uses = require('../../localdata/sguses.json'); //Funciones globales
const { randRange } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');

const frase = [
	'Oe po [m] <:junkNo:1107847991580164106>',
	'Wacho, cachai [m] <:yumou:1108316649553141770>',
	'Oe [m] qliao <:reibu:1107876018171162705>',
	'Responde po [m] <:mayuwu:1107843515385389128>',
	'¿Vai a responder [m]? <:haniwaSmile:1107847987201318944>',
	'[m], respondé altoke <:hypergardener:796931141851938827>',
	'Dale [m] ctm <:reibu:1107876018171162705>',
	'Wena po [m] como andai <:meguSmile:1107880958981587004>',
	'Pero qué andai haciendo po [m] rectm <:spookedSyura:725577379665281094>',
	'NoOoOoOo re TUuUrBiOoOoOo, veni [m] <:junkWTF:796930821260836864>',
	'[m] y eso pa? <:keikuwu:796930824028946432>',
	'Sácame de la jarra [m] po <:jarra:751600554702143579>',
	'Agáchate [m] <:lechita:931409943448420433>',
	'[m] ola <:elGato:796931141797675029>',
	'[m] uy se me resbaló el dedo <:cursed:657680175584247812>',
	'Se te ve la raja [m] <:detective:720736199727251536>',
];

/**
 * 
 * @param {import('../Commons/typings').ComplexCommandRequest} request 
 * @param {import('discord.js').User} user 
 * @param {number} cnt 
 * @param {boolean} isFirst 
 */
async function pinguear(request, user, cnt, isFirst) {
	const replyContent = { content: frase[randRange(0, frase.length)].replace('[m]', `${user}`) };

	if(isFirst)
		await request.reply(replyContent);
	else
		await request.channel.send(replyContent).catch(() => undefined);

	if(cnt > 1)
		setTimeout(pinguear, 800, request, user, cnt - 1, false);
}

const flags = new CommandTags().add(
	'MEME',
	'CHAOS',
);
const options = new CommandOptions()
	.addParam('cantidad', 'NUMBER', 'para indicar la cantidad de veces que se debe pinguear')
	.addParam('usuario', 'USER', 'para indicar el usuario a pinguear');
const command = new CommandManager('pinguear', flags)
	.setAliases('pingear', 'pingeara', 'pingueara', 'mencionar', 'mention', 'pingsomeone')
	.setBriefDescription('Pingea a un usuario una cantidad de veces')
	.setLongDescription('Pingea a un `<usuario>` una `<cantidad>` de veces')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const now = Date.now() * 1;
		const uid = request.userId;

		if(now - (uses.pinguear[uid] ?? 0) < 1000 * 60)
			return request.isInteraction
				? request.reply({ content: '⏳ Pero no seas tan degenerado, aflójale un poco', ephemeral: true })
				: request.inferAsMessage().react('⏳');
		
		if(request.isMessage && args.count < 2)
			return request.reply({ content: `⚠️ Debes ingresar 2 parámetros (\`${p_pure(request.guild.id).raw}pinguear <cantidad> <usuario>\`)`, ephemeral: true });
		
		let repeats = -1;
		let user;

		if(request.isInteraction) {
			repeats = Math.floor(args.getNumber('cantidad', 3));
			user = await args.getUser('usuario');
		} else {
			if(!isNaN(+args.args[0])) {
				repeats = Math.floor(args.getNumber('cantidad', 3));
				user = await args.getUser('usuario');
			} else if(!isNaN(+args.args[1])) {
				user = await args.getUser('usuario');
				repeats = Math.floor(args.getNumber('cantidad', 3));
			} else {
				return request.reply({
					content: `⚠️ Debes indicar un número y un usuario: (\`${p_pure(request.guild.id).raw}pinguear <cantidad> <usuario>\`)`,
					ephemeral: true,
				});
			}
		}

		if(repeats < 2 || repeats > 10)
			return request.reply({
				content: '⚠️ Solo puedes pinguear a alguien entre 2 y 10 veces',
				ephemeral: true,
			});

		if(!user)
			return request.reply({
				content: '⚠️ Usuario inválido',
				ephemeral: true,
			});

		uses.pinguear[uid] = now * 1;
		return pinguear(request, user, repeats, true);
	});

module.exports = command;
