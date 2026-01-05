const { Translator } = require('../../i18n');
const { PureVoiceSessionMember } = require('../../systems/others/purevoice.js');
const { PureVoiceModel, PureVoiceSessionModel } = require('../../models/purevoice.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');

const action = new ContextMenuActionManager('actionPVGiveMod', 'User')
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
        const sessionOther = new PureVoiceSessionMember(session.members.get(other.id) || { id: other.id });
		if(!sessionSelf.giveMod(sessionOther))
			return interaction.editReply({ content: '❌ Debes ser administrador de la sesión para darle mod a otro miembro y el otro miembro en cuestión debe ser un invitado' });

        sessionOther.setBanned(false);
		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');

        const controlPanel = /**@type {import('discord.js').TextChannel}*/(interaction.guild.channels.cache.get(pv.controlPanelId));

        await Promise.all([
            controlPanel.permissionOverwrites.edit(other, { ViewChannel: true }, { reason: 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_ENABLE' }).catch(console.error),
            voiceChannel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_CONNECT_ENABLE').catch(console.error),
            session.save(),
        ]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
    });

module.exports = action;
