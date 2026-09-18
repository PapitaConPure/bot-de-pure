import { MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { PureVoiceModel, PureVoiceSessionModel } from '@/models/purevoice';
import { getOrchestrator, PureVoiceSessionMember } from '@/systems/others/purevoice';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionPVTransferAdmin', 'User').setUserResponse(
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
				content: translator.getText('voiceSessionJoinExpected'),
			});

		const { guildId } = voiceChannel;

		const pvDocument = await PureVoiceModel.findOne({ guildId });
		if (!pvDocument)
			return interaction.editReply({
				content: translator.getText('voiceSessionJoinExpected'),
			});

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if (!session)
			return interaction.editReply({
				content: translator.getText('voiceSessionJoinExpected'),
			});

		const dbOther = other.voice?.channelId === voiceChannel.id && session.members.get(other.id);
		if (!dbOther)
			return interaction.editReply({
				content:
					'❌ El miembro al que le transfieras el cargo de administrador debe estar en la misma sesión que tú',
			});

		const schemaMember = session.members.get(member.id);
		if (!schemaMember)
			return interaction.editReply({
				content: translator.getText('voiceSessionJoinExpected'),
			});

		const sessionSelf = new PureVoiceSessionMember(schemaMember);
		const sessionOther = new PureVoiceSessionMember(dbOther);
		if (!sessionSelf.transferAdmin(sessionOther))
			return interaction.editReply({
				content: translator.getText('voiceSessionAdminExpected'),
			});

		session.members.set(member.id, sessionSelf.toJSON());
		session.members.set(other.id, sessionOther.toJSON());
		session.markModified('members');

		await Promise.all([
			session.save(),
			getOrchestrator(guildId).checkMemberPermissions(other, sessionOther, voiceChannel),
		]);

		return interaction.editReply({
			content: `**${translator.getText('feedDeletePostTitle')}**`,
		});
	},
);

export default action;
