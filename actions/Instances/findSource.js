const { Attachment } = require('discord.js');
const { Translator } = require('../../internationalization.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');
const { injectSauceNAOEmbeds } = require('../../systems/others/saucenao.js');
const SauceNAOUser = require('../../localdata/models/saucenaoUsers');

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
            : /**@type {Array<Attachment>}*/([]);
		
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
		
		await injectSauceNAOEmbeds(sauceNAOUser.clientId, queries, translator, { successes, failures });

		if(!successes.length && !failures.length)
			return interaction.editReply({ content: translator.getText('saucenaoInvalidImage') });

		return interaction.editReply({ embeds: [ ...successes, ...failures ] });
    });

module.exports = action;
