import { ContextMenuAction } from '../Commons/actionBuilder';
import { PureVoiceSessionMember, requestPVControlPanel, PVCPSuccess, PureVoiceActionHandler, getOrchestrator } from '../../systems/others/purevoice';
import { PureVoiceModel, PureVoiceSessionModel } from '../../models/purevoice';
import { MessageFlags } from 'discord.js';
import { Translator } from '../../i18n';

const action = new ContextMenuAction('actionPVRemoveMod', 'User')
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
			return interaction.editReply({ content: '❌ El miembro que degrades de moderador debe haber estado en la misma sesión que tú' });

		const sessionSelf = new PureVoiceSessionMember(session.members.get(member.id));
		const sessionOther = new PureVoiceSessionMember(dbOther);
		if(!sessionSelf.revokeMod(sessionOther))
			return interaction.editReply({ content: '❌ Debes ser administrador de la sesión para quitarle el mod a otro miembro y el otro miembro en cuestión debe ser un moderador' });

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
			controlPanel.permissionOverwrites.delete(other, 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_DISABLE').catch(console.error),
			session.save(),
		]);

		return interaction.editReply({ content: `**${translator.getText('feedDeletePostTitle')}**` });
	});

export default action;
