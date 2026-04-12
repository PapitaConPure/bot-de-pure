import { MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { PureVoiceModel, PureVoiceSessionModel } from '@/models/purevoice';
import {
	getOrchestrator,
	PureVoiceActionHandler,
	PureVoiceSessionMember,
	PVCPSuccess,
	requestPVControlPanel,
} from '@/systems/others/purevoice';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionPVBanMember', 'User').setUserResponse(
	async (interaction) => {
		const member = interaction.member;
		const other = interaction.targetMember;

		const [translator] = await Promise.all([
			Translator.from(member),
			interaction.deferReply({ flags: MessageFlags.Ephemeral }),
		]);

		const voiceState = member.voice;
		const voiceChannel = voiceState?.channel;

		if (!voiceChannel)
			return interaction.editReply({
				content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
			});

		const { guild, guildId } = voiceChannel;

		const pv = await PureVoiceModel.findOne({ guildId });
		if (!pv)
			return interaction.editReply({
				content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
			});

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session)
			return interaction.editReply({
				content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
			});

		const schemaMember = session.members.get(member.id);
		if (!schemaMember)
			return interaction.editReply({
				content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
			});

		const sessionSelf = new PureVoiceSessionMember(schemaMember);
		if (sessionSelf.isGuest())
			return interaction.editReply({
				content:
					'❌ Debes ser administrador o moderador de la sesión para expulsar a otro miembro',
			});

		const sessionOther = new PureVoiceSessionMember(
			session.members.get(other.id) || { id: other.id },
		);
		if (sessionOther.isAdmin())
			return interaction.editReply({
				content: '❌ No se puede expulsar al administrador de la sesión',
			});

		if (sessionSelf.id === sessionOther.id)
			return interaction.editReply({ content: '❌ No te puedes expulsar a ti mismo' });

		sessionOther.setBanned(true);
		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');

		const result = await requestPVControlPanel(guild, pv.categoryId, pv.controlPanelId);

		if (!result.success)
			return interaction.editReply({ content: 'PLACEHOLDER_PV_CONTROL_PANEL_REQUEST_FAIL' });

		const controlPanel = result.controlPanel;

		if (result.status === PVCPSuccess.Created) {
			const actionHandler = new PureVoiceActionHandler(guild, async (documentHandler) => {
				documentHandler.document.controlPanelId = result.controlPanel.id;
			});
			const orchestrator = getOrchestrator(guildId);
			await orchestrator.orchestrateAction(actionHandler);
		}

		await Promise.all([
			controlPanel.permissionOverwrites
				.delete(other, 'PLACEHOLDER_PV_REASON_BAN_VIEWCHANNEL_DISABLE')
				.catch(console.error),
			voiceChannel.permissionOverwrites
				.edit(
					other,
					{ Connect: false },
					{ reason: 'PLACEHOLDER_PV_REASON_UNBAN_CONNECT_DISABLE' },
				)
				.catch(console.error),
			other.voice
				?.disconnect('PLACEHOLDER_PV_REASON_BAN_MEMBER_DISCONNECT')
				.catch(console.error),
			session.save(),
		]);

		return interaction.editReply({
			content: `**${translator.getText('feedDeletePostTitle')}**`,
		});
	},
);

export default action;
