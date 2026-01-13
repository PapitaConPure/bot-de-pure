import { ContextMenuAction } from '../Commons/actionBuilder';
import { PureVoiceSessionMember, requestPVControlPanel, PVCPSuccess, PureVoiceActionHandler, getOrchestrator } from '../../systems/others/purevoice';
import { PureVoiceModel, PureVoiceSessionModel } from '../../models/purevoice';
import { MessageFlags } from 'discord.js';
import { Translator } from '../../i18n';

const action = new ContextMenuAction('actionPVTransferAdmin', 'User')
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
			const result = await requestPVControlPanel(guild, pv.categoryId, pv.controlPanelId);
			
			if(!result.success)
				return;

			const controlPanel = result.controlPanel;

			if(result.status === PVCPSuccess.Created) {
				const actionHandler = new PureVoiceActionHandler(guild, async(documentHandler) => {
					documentHandler.document.controlPanelId = result.controlPanel.id;
				});
				const orchestrator = getOrchestrator(guildId);
				orchestrator.orchestrateAction(actionHandler);
			}

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

export default action;
