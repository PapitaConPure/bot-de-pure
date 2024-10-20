const { Translator } = require('../../internationalization.js');
const { PureVoiceSessionMember } = require('../../systems/others/purevoice.js');
const { PureVoiceModel, PureVoiceSessionModel } = require('../../localdata/models/purevoice.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');

const action = new ContextMenuActionManager('actionPVBanMember', 'User')
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
        
        const sessionSelf = new PureVoiceSessionMember(session.members.get(member.id));
		if(sessionSelf.isGuest())
			return interaction.editReply({ content: '❌ Debes ser administrador o moderador de la sesión para expulsar a otro miembro' });
        
        const sessionOther = new PureVoiceSessionMember(session.members.get(other.id) || { id: other.id });
		if(sessionOther.isAdmin())
			return interaction.editReply({ content: '❌ No se puede expulsar al administrador de la sesión' });

        if(sessionSelf.id === sessionOther.id)
            return interaction.editReply({ content: '❌ No te puedes expulsar a ti mismo' });

        sessionOther.setBanned(true);
		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');

        const controlPanel = /**@type {import('discord.js').TextChannel}*/(interaction.guild.channels.cache.get(pv.controlPanelId));

        await Promise.all([
            controlPanel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_BAN_VIEWCHANNEL_DISABLE').catch(console.error),
            voiceChannel.permissionOverwrites.edit(other, { Connect: false }, { reason: 'PLACEHOLDER_PV_REASON_UNBAN_CONNECT_DISABLE' }).catch(console.error),
            other.voice?.disconnect('PLACEHOLDER_PV_REASON_BAN_MEMBER_DISCONNECT').catch(console.error),
            session.save(),
        ]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
    });

module.exports = action;
