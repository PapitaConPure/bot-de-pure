const { sleep, fetchUser } = require('../../func');
const { p_pure } = require('../../utils/prefixes');
const { CommandPermissions } = require('../Commons/cmdPerms.js');
const { CommandOptions, CommandTags, Command } = require("../Commons/commands");

/**@param {import('../Commons/typings.js').ComplexCommandRequest} message*/
function safeDelete(message) {
	if(!message?.delete) return;
	return message.delete().catch(() => undefined);
}

/**
 * @param {import('discord.js').GuildTextBasedChannel} channel
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
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request 
 * @param {import('discord.js').Message} reply 
 */
function deleteOriginalAndReply(request, reply) {
	return Promise.all([
		safeDelete(request),
		request.isMessage && sleep(1000 * 5).then(() => reply.delete().catch(() => undefined)),
	]);
}

const perms = new CommandPermissions('ManageMessages');
const options = new CommandOptions()
	.addParam('cantidad', 'NUMBER', 'para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)', { optional: true })
	.addFlag('um', ['usuario', 'miembro'], 			'para especificar de qué usuario borrar mensajes', { name: 'user', type: 'USER' });
const tags = new CommandTags().add('MOD');
const command = new Command('borrar', tags)
	.setAliases(
		'borrarmsg',
        'deletemsg', 'delete',
        'del', 'd',
	)
	.setLongDescription('Elimina una cierta cantidad de mensajes entre 2 y 100')
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const userResult = /**@type {string | import('discord.js').User}*/(args.flagExprIf('usuario'));
		const user = userResult ? fetchUser(userResult, request) : undefined;
		const amount = args.getNumber('cantidad', 100);

		if(!user && !amount) {
			const sent = await request.reply({ content: '⚠️ Debes especificar la cantidad o el autor de los mensajes a borrar', ephemeral: true });
			return request.isMessage && deleteOriginalAndReply(request, sent);
		}

		if(isNaN(amount)) {
			const sent = await request.reply({
				content:
					'⚠️ Debes especificar la cantidad de mensajes a borrar\n' +
					`Revisa \`${p_pure(request.guildId).raw}ayuda borrar\` para más información`,
				ephemeral: true,
			});
			return deleteOriginalAndReply(request, sent);
		}

		if(request.isInteraction)
			await request.deferReply({ ephemeral: true });

		if(request.isMessage)
			await safeDelete(request);

		const cappedAmount = Math.max(2, Math.min(amount, 100));
		
		await bulkDeleteMessages(request.channel, cappedAmount, user);

		if(request.isInteraction)
			return request.editReply({ content: '✅ Mensajes eliminados' });
	});

module.exports = command;
