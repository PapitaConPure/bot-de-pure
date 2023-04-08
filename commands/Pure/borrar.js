const { fetchUser, sleep } = require('../../func.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

/**@param {import('discord.js').Message<true>} message*/
function safeDelete(message) {
	if(!message?.delete) return;
	return message.delete().catch(_ => undefined);
}

/**
 * @param {import('discord.js').TextChannel} channel
 * @param {Number} amount
 * @param {import('discord.js').User} user
 */
async function bulkDeleteMessages(channel, amount, user) {
	if(user == undefined)
		return channel.bulkDelete(amount);
	
	const messages = await channel.messages.fetch({ limit: 100 });
	let i = 0;
	return channel.bulkDelete(messages.filter(msg => msg.author.id === user.id && i++ < amount));
}

/**
 * @param {import('discord.js').Message<true>} original 
 * @param {import('discord.js').Message<true>} reply 
 */
function deleteOriginalAndReply(original, reply) {
	return Promise.all([
		safeDelete(original),
		sleep(1000 * 5).then(() => reply.delete().catch(_ => undefined)),
	]);
}

const options = new CommandOptionsManager()
	.addParam('cantidad', 'NUMBER', 'para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)', { optional: true })
	.addFlag('um', ['usuario', 'miembro'], 			'para especificar de qué usuario borrar mensajes', { name: 'user', type: 'USER' });
const flags = new CommandMetaFlagsManager().add('MOD');
const command = new CommandManager('borrar', flags)
	.setAliases(
		'borrarmsg',
        'deletemsg', 'delete',
        'del', 'd',
	)
	.setLongDescription('Elimina una cierta cantidad de mensajes entre 2 y 100')
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		const user = options.fetchFlag(args, 'usuario', { callback: (f) => fetchUser(f, request) });
		let amount = options.fetchParam(args, 'cantidad') ?? 100;

		if(!user && !amount) {
			const sent = await request.reply({ content: '⚠ Debes especificar la cantidad o el autor de los mensajes a borrar', ephemeral: true });
			return !isSlash && deleteOriginalAndReply(request, sent);
		}

		if(isNaN(amount)) {
			const sent = request.reply({
				content:
					'⚠ Debes especificar la cantidad de mensajes a borrar\n' +
					`Revisa \`${p_pure(request.guildId).raw}ayuda borrar\` para más información`,
				ephemeral: true,
			});
			return !isSlash && deleteOriginalAndReply(request, sent);
		}

		if(isSlash)
			await request.deferReply({ ephemeral: true });
		else
			await safeDelete(request);

		amount = Math.max(2, Math.min(amount, 100));
		
		await bulkDeleteMessages(request.channel, amount, user);

		if(isSlash)
			return request.editReply({ content: '✅ Mensajes eliminados' });
	});

module.exports = command;