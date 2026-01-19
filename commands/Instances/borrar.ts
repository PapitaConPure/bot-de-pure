import { sleep, fetchUser } from '../../func';
import { p_pure } from '../../utils/prefixes';
import { CommandPermissions } from '../Commons/cmdPerms.js';
import { CommandOptions, CommandTags, Command } from '../Commons/';
import { ComplexCommandRequest } from '../Commons/typings.js';
import { GuildTextBasedChannel, Message, MessageFlags, User } from 'discord.js';

async function safeDelete(message: ComplexCommandRequest) {
	if(!message?.delete) return;
	try {
		return await message.delete();
	} catch {
		return undefined;
	}
}

async function bulkDeleteMessages(channel: GuildTextBasedChannel, amount: number, user: User) {
	if(user == undefined)
		return channel.bulkDelete(amount);

	const messages = await channel.messages.fetch({ limit: 100 });
	let i = 0;
	return channel.bulkDelete(messages.filter(msg => msg.author.id === user.id && i++ < amount));
}

function deleteOriginalAndReply(request: ComplexCommandRequest, reply: Message) {
	return Promise.all([
		safeDelete(request),
		request.isMessage && sleep(1000 * 5).then(() => reply.delete().catch(() => undefined)),
	]);
}

const perms = new CommandPermissions('ManageMessages');

const options = new CommandOptions()
	.addParam('cantidad', 'NUMBER', 'para especificar la cantidad de mensajes a borrar (sin contar el mensaje del comando)', { optional: true })
	.addFlag('um', [ 'usuario', 'miembro' ], 			'para especificar de qué usuario borrar mensajes', { name: 'user', type: 'USER' });

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
		const userSearch = args.parseFlagExpr('usuario');
		const user = userSearch ? fetchUser(userSearch, request) : undefined;
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
			await request.deferReply({ flags: MessageFlags.Ephemeral });

		if(request.isMessage)
			await safeDelete(request);

		const cappedAmount = Math.max(2, Math.min(amount, 100));

		await bulkDeleteMessages(request.channel, cappedAmount, user);

		if(request.isInteraction)
			return request.editReply({ content: '✅ Mensajes eliminados' });
	});

export default command;
