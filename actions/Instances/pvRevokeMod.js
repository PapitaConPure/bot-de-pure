const { Translator } = require('../../internationalization.js');
const { PureVoiceSessionMember } = require('../../systems/others/purevoice.js');
const { PureVoiceModel, PureVoiceSessionModel } = require('../../localdata/models/purevoice.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');

const action = new ContextMenuActionManager('actionPVRemoveMod', 'User')
    .setUserResponse(async interaction => {
        await interaction.deferReply({ ephemeral: true });

        const member = interaction.member;
        const other = interaction.targetMember;

        const translator = await Translator.from(member);

        const voiceChannel = member.voice?.channel;
        if(!voiceChannel) return interaction.editReply({ content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción' });

        const pv = await PureVoiceModel.findOne({ guildId: voiceChannel.guildId });
        if(!pv) return interaction.editReply({ content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción' });

        const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
        if(!session) return interaction.editReply({ content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción' });
        
        const dbOther = session.members.get(other.id);
        if(!dbOther)
            return interaction.editReply({ content: '❌ El miembro que degrades de moderador debe haber estado en la misma sesión que tú' });

        const sessionSelf = new PureVoiceSessionMember(session.members.get(member.id));
        const sessionOther = new PureVoiceSessionMember(dbOther);
		if(!sessionSelf.revokeMod(sessionOther))
			return interaction.editReply({ content: '❌ Debes ser administrador de la sesión para quitarle el mod a otro miembro y el otro miembro en cuestión debe ser un moderador' });

		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');

        const controlPanel = /**@type {import('discord.js').TextChannel}*/(interaction.guild.channels.cache.get(pv.controlPanelId));

        await Promise.all([
            controlPanel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_DISABLE').catch(console.error),
            session.save(),
        ]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
    });

module.exports = action;
