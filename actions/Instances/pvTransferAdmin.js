const { Translator } = require('../../internationalization.js');
const { PureVoiceSessionMember } = require('../../systems/others/purevoice.js');
const { PureVoiceModel, PureVoiceSessionModel } = require('../../localdata/models/purevoice.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');

const action = new ContextMenuActionManager('actionPVTransferAdmin', 'User')
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
        
        const dbOther = (other.voice?.channelId === voiceChannel.id) && session.members.get(other.id);
        if(!dbOther)
            return interaction.editReply({ content: '❌ El miembro al que le transfieras el cargo de administrador debe estar en la misma sesión que tú' });

        const sessionSelf = new PureVoiceSessionMember(session.members.get(member.id));
        const sessionOther = new PureVoiceSessionMember(dbOther);
		if(!sessionSelf.exchangeAdmin(sessionOther))
			return interaction.editReply({ content: '❌ Debes ser administrador de la sesión para transferir tu posición' });

		session.members.set(member.id, sessionSelf.toJSON());
		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');

		const tweakControlPanelPerms = async () => {
			const controlPanel = /**@type {import('discord.js').TextChannel}*/(interaction.guild.channels.cache.get(pv.controlPanelId));
			if(sessionSelf.isGuest())
				await controlPanel.permissionOverwrites.delete(member, 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_DISABLE').catch(console.error);
			await Promise.all([
                controlPanel.permissionOverwrites.edit(other, { ViewChannel: true }, { reason: 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_ENABLE' }).catch(console.error),
                voiceChannel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_CONNECT_ENABLE').catch(console.error),
            ]);
		};

        await Promise.all([
			session.save(),
			tweakControlPanelPerms(),
        ]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
    });

module.exports = action;
