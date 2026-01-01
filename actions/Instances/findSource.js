const { Translator } = require('../../i18n/internationalization');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');
const { pourSauce } = require('../../systems/others/saucenao.js');
const SauceNAOUser = require('../../models/saucenaoUsers.js');

const action = new ContextMenuActionManager('actionFindSource', 'Message')
    .setMessageResponse(async interaction => {
        const message = interaction.targetMessage;
        const uid = interaction.user.id;
        const translator = await Translator.from(uid);
            
        const sauceNAOUser = (await SauceNAOUser.findOne({ userId: interaction.user.id }));
        if(!sauceNAOUser)
            return interaction.reply({
                content: translator.getText('saucenaoUnregisteredNotice'),
                ephemeral: true,
            });

        const messageAttachments = message.attachments
            ? [ ...message.attachments.values() ]
            : /**@type {Array<import('discord.js').Attachment>}*/([]);
		
		const attachmentUrls = messageAttachments.map(att => att.url);
		const otherMessageUrls = message.embeds
			?.flatMap(e => [ e.image?.url, e.thumbnail?.url ])
			.filter(u => u)
			|| [];

		const queries = [
			...attachmentUrls,
			...otherMessageUrls,
		].slice(0, 5);

		if(!queries.length)
			return interaction.reply({
                content: translator.getText('saucenaoInvalidImage'),
                ephemeral: true,
            });
        
		await interaction.deferReply({ ephemeral: true });

		const successes = [];
		const failures = [];
		
		await pourSauce(sauceNAOUser.clientId, queries, interaction, { successes, failures });

		if(!successes.length && !failures.length)
			return interaction.editReply({ content: translator.getText('saucenaoInvalidImage') });

		return interaction.editReply({ embeds: [ ...successes, ...failures ] });
    });

module.exports = action;
