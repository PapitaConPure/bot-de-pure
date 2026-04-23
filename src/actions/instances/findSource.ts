import {
	type Attachment,
	type EmbedBuilder,
	type GuildTextBasedChannel,
	MessageFlags,
} from 'discord.js';
import { Translator } from '@/i18n';
import SauceNAOUserModel from '@/models/saucenaoUsers';
import { getMainBooruClient } from '@/systems/booru/booruclient';
import { pourSauce } from '@/systems/others/saucenao';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionFindSource', 'Message').setMessageResponse(
	async (interaction) => {
		const message = interaction.targetMessage;
		const uid = interaction.user.id;
		const translator = await Translator.from(uid);

		const sauceNAOUser = await SauceNAOUserModel.findOne({ userId: interaction.user.id });
		if (!sauceNAOUser)
			return interaction.reply({
				content: translator.getText('saucenaoUnregisteredNotice'),
				flags: MessageFlags.Ephemeral,
			});

		const messageAttachments = message.attachments
			? [...message.attachments.values()]
			: ([] as Attachment[]);

		const attachmentUrls = messageAttachments.map((att) => att.url);
		const otherMessageUrls =
			message.embeds
				?.flatMap((e) => [e.image?.url, e.thumbnail?.url] as string[])
				.filter((u) => u) || [];

		const queries = [...attachmentUrls, ...otherMessageUrls].slice(0, 5);

		if (!queries.length)
			return interaction.reply({
				content: translator.getText('saucenaoInvalidImage'),
				flags: MessageFlags.Ephemeral,
			});

		const booru = getMainBooruClient();
		if (!booru)
			return interaction.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('missingBooruCredentials'),
			});

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const successes: EmbedBuilder[] = [];
		const failures: EmbedBuilder[] = [];

		await pourSauce(
			sauceNAOUser.clientId,
			queries,
			interaction as typeof interaction & { channel: GuildTextBasedChannel },
			{ successes, failures },
		);

		if (!successes.length && !failures.length)
			return interaction.editReply({ content: translator.getText('saucenaoInvalidImage') });

		return interaction.editReply({ embeds: [...successes, ...failures] });
	},
);

export default action;
