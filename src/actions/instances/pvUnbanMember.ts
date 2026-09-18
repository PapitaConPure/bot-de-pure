import { MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { PureVoiceModel, PureVoiceSessionModel } from '@/models/purevoice';
import { getOrchestrator, PureVoiceSessionMember } from '@/systems/others/purevoice';
import { ContextMenuAction } from '../commons/actionBuilder';

const action = new ContextMenuAction('actionPVUnbanMember', 'User').setUserResponse(
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

		const { guildId } = voiceChannel;

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

		const dbOther = session.members.get(other.id);
		if (!dbOther)
			return interaction.editReply({
				content: '❌ El miembro que expulses debe haber estado en la misma sesión que tú',
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
					'❌ Debes ser administrador o moderador de la sesión para quitarle la expulsión a un miembro',
			});

		const sessionOther = new PureVoiceSessionMember(dbOther);
		if (sessionOther.isAdmin())
			return interaction.editReply({
				content: '❌ No se puede expulsar al administrador de la sesión',
			});

		if (sessionSelf.id === sessionOther.id)
			return interaction.editReply({
				content: '❌ No te puedes quitar una expulsión por tu cuenta',
			});

		sessionOther.setBanned(false);
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
