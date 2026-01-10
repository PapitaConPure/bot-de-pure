const { Translator } = require('../../i18n');
const { PureVoiceSessionMember, requestPVControlPanel, PVCPSuccess, PureVoiceActionHandler, getOrchestrator } = require('../../systems/others/purevoice.js');
const { PureVoiceModel, PureVoiceSessionModel } = require('../../models/purevoice.js');
const { ContextMenuActionManager } = require('../Commons/actionBuilder.js');
const { MessageFlags } = require('discord.js');

const action = new ContextMenuActionManager('actionPVGiveMod', 'User')
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

		const sessionSelf = new PureVoiceSessionMember(session.members.get(member.id));
		const sessionOther = new PureVoiceSessionMember(session.members.get(other.id) || { id: other.id });
		if(!sessionSelf.giveMod(sessionOther))
			return interaction.editReply({ content: '❌ Debes ser administrador de la sesión para darle mod a otro miembro y el otro miembro en cuestión debe ser un invitado' });

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
			controlPanel.permissionOverwrites.edit(other, { ViewChannel: true }, { reason: 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_ENABLE' }).catch(console.error),
			voiceChannel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_CONNECT_ENABLE').catch(console.error),
			session.save(),
		]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
	});

module.exports = action;
