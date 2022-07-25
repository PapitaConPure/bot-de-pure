const { fetchFlag, fetchUser } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
	.addParam('cantidad', 'NUMBER', 'para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)')
	.addFlag('um', ['usuario', 'miembro'], 			'para especificar de qué usuario borrar mensajes', { name: 'user', type: 'USER' });

module.exports = {
	name: 'borrar',
	aliases: [
		'borrarmsg',
        'deletemsg', 'delete',
        'del', 'd', 
    ],
    desc: 'Elimina una cierta cantidad de mensajes entre 2 y 100',
    flags: new CommandMetaFlagsManager().add('MOD'),
    options,
	callx: '<cantidad>',
	
	async execute(message, args) {
		await message.delete();
		if(!args.length) {
			const sent = await message.reply({ content: ':warning: debes especificar la cantidad o el autor de los mensajes a borrar.' });
			setTimeout(() => sent.delete(), 1000 * 5);
			return;
		}
		const user = fetchFlag(args, { property: true, short: ['u'], long: ['usuario', 'miembro'], callback: (x, i) => fetchUser(x[i], message), fallback: undefined });
		let amt = (args.length) ? parseInt(args[0]) : 100;
		if(isNaN(amt)) {
			return message.reply({
				content:
					':warning: Debes especificar la cantidad de mensajes a borrar\n' +
					`Revisa \`${p_pure(message.guildId).raw}ayuda borrar\` para más información`
			});
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