import { ContextMenuAction } from '../Commons/actionBuilder';
import { getAgentMessageOwnerId, deleteAgentMessage } from '../../systems/agents/discordagent';
import { Translator } from '../../i18n';

const action = new ContextMenuAction('actionDeleteUserPost', 'Message')
	.setMessageResponse(async interaction => {
		const message = interaction.targetMessage;
		const uid = interaction.user.id;
		const translator = await Translator.from(uid);

		if((message.webhookId == undefined || message.webhookId.length == 0) && message.author.id !== interaction.client.user.id)
			return interaction.reply({
				content: translator.getText('invalidMessage'),
				ephemeral: true,
			});

		if(uid !== getAgentMessageOwnerId(message.id) && !interaction.member.permissionsIn(interaction.channel).has('ManageMessages')) {
			return interaction.reply({
				content: translator.getText('unauthorizedInteraction'),
				ephemeral: true,
			});
		}

		return Promise.all([
			interaction.reply({
				content: `**${translator.getText('feedDeletePostTitle')}**`,
				ephemeral: true,
			}),
			deleteAgentMessage(message),
		]);
	});

export default action;
