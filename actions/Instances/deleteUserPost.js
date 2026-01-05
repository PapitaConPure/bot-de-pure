const { Translator } = require('../../i18n');
const { getAgentMessageOwnerId, deleteAgentMessage } = require('../../systems/agents/discordagent');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');

const action = new ContextMenuActionManager('actionDeleteUserPost', 'Message')
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

module.exports = action;
