const { p_pure } = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const { fetchFlag, fetchUser } = require('../../func.js');

module.exports = {
	name: 'borrar',
	aliases: [
		'borrarmsg',
        'deletemsg', 'delete',
        'del', 'd', 
    ],
    desc: 'Elimina una cierta cantidad de mensajes entre 2 y 100',
    flags: [
        'mod'
    ],
    options: [
		'`<cantidad>` _(número)_ para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)',
		'`-u <user>` o `--usuario <user>` _(mención/texto/id)_ para especificar de qué usuario borrar mensajes'
    ],
	callx: '<cantidad>',
	
	async execute(message, args) {
		await message.delete();
		if(!args.length) {
			const sent = await message.channel.send({ content: ':warning: debes especificar la cantidad o el autor de los mensajes a borrar.' });
			setTimeout(() => sent.delete(), 1000 * 5);
			return;
		}
		const user = fetchFlag(args, { property: true, short: ['u'], long: ['usuario'], callback: (x, i) => fetchUser(x[i], message), fallback: undefined });
		let amt = (args.length) ? parseInt(args[0]) : 100;
		if(isNaN(amt)) {
			message.channel.send({
				content:
					':warning: Debes especificar la cantidad de mensajes a borrar\n' +
					`Revisa \`${p_pure.raw}ayuda borrar\` para más información`
			});
			return;
		}
		amt = Math.max(2, Math.min(amt, 100));
		
		if(user === undefined)
			message.channel.bulkDelete(amt);
		else {
			const messages = await message.channel.messages.fetch({ limit: 100 });
			let i = 0;
			message.channel.bulkDelete(messages.filter(msg => msg.author.id === user.id && i++ < amt));
		}
    },
};