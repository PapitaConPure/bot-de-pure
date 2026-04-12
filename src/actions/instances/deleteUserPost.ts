import { MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { deleteAgentMessage, getAgentMessageOwnerId } from '@/utils/discordagent';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionDeleteUserPost', 'Message').setMessageResponse(
	async (interaction) => {
		const message = interaction.targetMessage;
		const uid = interaction.user.id;
		const translator = await Translator.from(uid);

		if (
			(message.webhookId == null || message.webhookId.length === 0)
			&& message.author.id !== interaction.client.user.id
		)
			return interaction.reply({
				content: translator.getText('invalidMessage'),
				flags: MessageFlags.Ephemeral,
			});

		if (
			uid !== getAgentMessageOwnerId(message.id)
			&& interaction.channel
			&& !interaction.member.permissionsIn(interaction.channel).has('ManageMessages')
		) {
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				flags: MessageFlags.Ephemeral,
			});
		}

		return Promise.all([
			interaction.reply({
				content: `**${translator.getText('feedDeletePostTitle')}**`,
				flags: MessageFlags.Ephemeral,
			}),
			deleteAgentMessage(message),
		]);
	},
);

export default action;
