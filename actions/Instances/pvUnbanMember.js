const { Translator } = require('../../i18n');
const { PureVoiceSessionMember, requestPVControlPanel, PVCPSuccess, PureVoiceActionHandler, getOrchestrator } = require('../../systems/others/purevoice.js');
const { PureVoiceModel, PureVoiceSessionModel } = require('../../models/purevoice.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');
const { MessageFlags } = require('discord.js');

const action = new ContextMenuActionManager('actionPVUnbanMember', 'User')
	.setUserResponse(async interaction => {
		const member = interaction.member;
		const other = interaction.targetMember;

		const [ translator ] = await Promise.all([
			Translator.from(member),
			interaction.deferReply({ flags: MessageFlags.Ephemeral }),
		]);

		const voiceState = member.voice;
		const voiceChannel = voiceState?.channel;
		const { guild, guildId } = voiceChannel;

		if(!voiceChannel) return interaction.editReply({ content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción' });

		const pv = await PureVoiceModel.findOne({ guildId });
		if(!pv) return interaction.editReply({ content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción' });

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if(!session) return interaction.editReply({ content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción' });
		
		const dbOther = session.members.get(other.id);
		if(!dbOther)
			return interaction.editReply({ content: '❌ El miembro que expulses debe haber estado en la misma sesión que tú' });

		const sessionSelf = new PureVoiceSessionMember(session.members.get(member.id));
		if(sessionSelf.isGuest())
			return interaction.editReply({ content: '❌ Debes ser administrador o moderador de la sesión para quitarle la expulsión a un miembro' });
		
		const sessionOther = new PureVoiceSessionMember(dbOther);
		if(sessionOther.isAdmin())
			return interaction.editReply({ content: '❌ No se puede expulsar al administrador de la sesión' });

		if(sessionSelf.id === sessionOther.id)
			return interaction.editReply({ content: '❌ No te puedes quitar una expulsión por tu cuenta' });

		sessionOther.setBanned(false);
		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');
		
		const result = await requestPVControlPanel(guild, pv.categoryId, pv.controlPanelId);
		
		if(!result.success)
			return interaction.editReply({ content: 'PLACEHOLDER_PV_CONTROL_PANEL_REQUEST_FAIL' });

		const controlPanel = result.controlPanel;

		if(result.status === PVCPSuccess.Created) {
			const actionHandler = new PureVoiceActionHandler(guild, async(documentHandler) => {
				documentHandler.document.controlPanelId = result.controlPanel.id;
			});
			const orchestrator = getOrchestrator(guildId);
			orchestrator.orchestrateAction(actionHandler);
		}

		await Promise.all([
			controlPanel.permissionOverwrites.edit(other, { ViewChannel: true }, { reason: 'PLACEHOLDER_PV_REASON_UNBAN_VIEWCHANNEL_ENABLE' }).catch(console.error),
			voiceChannel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_UNBAN_CONNECT_ENABLE').catch(console.error),
			session.save(),
		]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
	});

module.exports = action;
