import { EmbedBuilder, MessageFlags } from 'discord.js';
import type { ComplexCommandRequest } from 'types/commands';
import { globalConfigs, tenshiColor } from '@/data/globalProps';
import { compressId, improveNumber, sleep } from '@/func';
import { Translator } from '@/i18n';
import { defaultLocale } from '@/i18n/locales';
import UserConfigModel from '@/models/userconfigs';
import { auditError } from '@/systems/others/auditor';
import { getBotEmoji } from '@/utils/emojis';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandOptions, CommandTags } from '../commons';

const transferLocks = new Set<string>();

const options = new CommandOptions()
	.addParam('monto', 'NUMBER', 'para especificar el monto a pagar en PRC')
	.addParam('usuario', 'USER', 'para especificar el usuario al cual transferir PRC');

const flags = new CommandTags().add('COMMON');
const command = new Command(
	{
		es: 'transferir',
		en: 'transfer',
		ja: 'transfer',
	},
	flags,
)
	.setAliases('transfer', 'tf')
	.setDescription('Permite transferir PRC a otro usuario')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const [translator] = await Promise.all([
			Translator.from(request.userId),
			request.deferReply({ flags: MessageFlags.Ephemeral }),
		]);

		if (args.isMessageSolver(args.args)) swapIfNeeded(args.args);

		const amount = args.getNumber('monto');
		const target = args.getUser('usuario');

		if (!amount || Number.isNaN(+amount))
			return request.editReply({ content: translator.getText('transferAmountExpected') });

		if (!target)
			return request.editReply({ content: translator.getText('transferTargetExpected') });

		if (target.bot)
			return request.editReply({ content: translator.getText('transferHumanExpected') });

		if (request.userId === target.id)
			return request.editReply({ content: translator.getText('transferOtherExpected') });

		if (amount < 1)
			return request.editReply({ content: translator.getText('transferAmountTooLow') });

		const { userId } = request;
		const { id: targetId } = target;

		while (transferLocks.has(userId) || transferLocks.has(targetId)) await sleep(50);

		try {
			transferLocks.add(userId);
			transferLocks.add(targetId);

			const userQuery = { userId: userId };
			const targetQuery = { userId: targetId };
			const [userConfigs, targetConfigs] = await Promise.all([
				(async () =>
					(await UserConfigModel.findOne(userQuery)) || new UserConfigModel(userQuery))(),
				(async () =>
					(await UserConfigModel.findOne(targetQuery))
					|| new UserConfigModel(targetQuery))(),
			]);

			if (amount > userConfigs.prc)
				return request.editReply({ content: translator.getText('transferInsufficient') });

			userConfigs.prc -= amount;
			targetConfigs.prc += amount;
			const transactionCode = makeTransactionCode(request);

			const embed = new EmbedBuilder()
				.setColor(tenshiColor)
				.setAuthor({
					name: translator.getText('transferAuthorName'),
					iconURL: request.guild.iconURL({ size: 256 }) ?? undefined,
				})
				.setTitle(translator.getText('transferTitle'))
				.addFields(
					{
						name: translator.getText('transferFromName'),
						value: `${request.user.tag}\nID \`${request.userId}\``,
						inline: true,
					},
					{
						name: translator.getText('transferForName'),
						value: `${target.tag}\nID \`${target.id}\``,
						inline: true,
					},
					{
						name: translator.getText('transferAmountName'),
						value: `${getBotEmoji('prc')} ${improveNumber(amount, { shorten: true })}`,
						inline: true,
					},
					{
						name: translator.getText('transferCodeName'),
						value: `\`\`\`\n${transactionCode}\n\`\`\``,
					},
				);

			await Promise.all([targetConfigs.save(), userConfigs.save()]);

			const receipt = { embeds: [embed] };
			return Promise.all([
				request.editReply(receipt).catch((_) => _),
				request.user.send(receipt).catch((_) => _),
				target.send(receipt).catch((_) => _),
				globalConfigs.logch?.send(receipt).catch(console.error),
			]);
		} catch (error) {
			console.error(error);
			auditError(error, {
				request,
				brief: 'Ocurrió un error durante una transacción',
				details: `${p_pure(request)}${command.localizedNames[defaultLocale]} ${amount} ${userId}`,
				ping: true,
			});
			return request.editReply({ content: translator.getText('transferError') });
		} finally {
			transferLocks.delete(userId);
			transferLocks.delete(targetId);
		}
	});

function swapIfNeeded(args: string[]) {
	if (!Array.isArray(args)) return;

	const amount = +args[0];

	if (!Number.isNaN(amount)) return;

	const t = args[0];
	args[0] = args[1];
	args[1] = t;
}

export function makeTransactionCode(request: ComplexCommandRequest) {
	const requestId = request.id;
	const channelId = request.channel.id;

	const compRequestId = compressId(requestId);
	const compChannelId = compressId(channelId);

	const requestIdMidpoint = Math.floor(requestId.length / 2);
	const channelIdMidpoint = Math.floor(channelId.length / 2);
	const halfRequestId = requestId.slice(0, requestIdMidpoint);
	const halfChannelId = channelId.slice(channelIdMidpoint);

	const piHashedIds = Math.floor(+`${halfRequestId}${halfChannelId}` / Math.PI);
	const compMergedIds = compressId(`${piHashedIds}`);

	return `[${compRequestId}]${compChannelId}{${compMergedIds}}`;
}

export default command;
