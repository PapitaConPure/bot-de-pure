import type { Attachment, EmbedBuilder, GuildTextBasedChannel } from 'discord.js';
import { Translator } from '@/i18n';
import SauceNAOUser from '@/models/saucenaoUsers';
import { pourSauce } from '@/systems/others/saucenao';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionFindSource', 'Message').setMessageResponse(
	async (interaction) => {
		const message = interaction.targetMessage;
		const uid = interaction.user.id;
		const translator = await Translator.from(uid);

		const sauceNAOUser = await SauceNAOUser.findOne({ userId: interaction.user.id });
		if (!sauceNAOUser)
			return interaction.reply({
				content: translator.getText('saucenaoUnregisteredNotice'),
				ephemeral: true,
			});

		const messageAttachments = message.attachments
			? [...message.attachments.values()]
			: ([] as Attachment[]);

		const attachmentUrls = messageAttachments.map((att) => att.url);
		const otherMessageUrls =
			message.embeds?.flatMap((e) => [e.image?.url, e.thumbnail?.url] as string[]).filter((u) => u) || [];

		const queries = [...attachmentUrls, ...otherMessageUrls].slice(0, 5);

		if (!queries.length)
			return interaction.reply({
				content: translator.getText('saucenaoInvalidImage'),
				ephemeral: true,
			});

		await interaction.deferReply({ ephemeral: true });

		const successes: EmbedBuilder[] = [];
		const failures: EmbedBuilder[] = [];

		await pourSauce(sauceNAOUser.clientId, queries, interaction as typeof interaction & { channel: GuildTextBasedChannel }, { successes, failures });

		if (!successes.length && !failures.length)
			return interaction.editReply({ content: translator.getText('saucenaoInvalidImage') });

		return interaction.editReply({ embeds: [...successes, ...failures] });
	},
);

export default action;
