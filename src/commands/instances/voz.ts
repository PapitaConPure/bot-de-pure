import { addMinutes, getUnixTime, isBefore } from 'date-fns';
import { MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { PureVoiceSessionModel } from '@/models/purevoice.js';
import { PureVoiceSessionMember } from '@/systems/others/purevoice.js';
import { parseUnicodeEmoji } from '@/utils/emojis';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandOptions, CommandTags } from '../commons';

const options = new CommandOptions()
	.addParam('nombre', 'TEXT', 'para decidir el nombre de la sesión actual', { optional: true })
	.addFlag('e', ['emote', 'emoji'], 'para determinar el emote de la sesión actual', {
		name: 'emt',
		type: 'EMOTE',
	});

const tags = new CommandTags().add('COMMON');

const command = new Command(
	{
		es: 'voz',
		en: 'voice',
		ja: 'voice',
	},
	tags,
)
	.setAliases('purévoz', 'purevoz', 'purévoice', 'purevoice', 'vc')
	.setDescription('Permite manipular sesiones de voz del sistema PuréVoice')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.fromUser(request);

		const voiceState = request.member.voice;
		const warnNotInSession = () =>
			request
				.reply({
					content: translator.getText(
						'voiceCommandRenameMemberExpected',
						p_pure(request).raw,
					),
					flags: MessageFlags.Ephemeral,
				})
				.catch(console.error);

		const emoteString = args.flagExprIf('emote', (x) => `${x}`, '💠');
		const sessionEmote = parseUnicodeEmoji(emoteString);
		const sessionName = args.getString('nombre', true);

		if (!sessionName)
			return request.reply({
				content: translator.getText('voiceSessionNameExpected', p_pure(request).raw),
				flags: MessageFlags.Ephemeral,
			});

		if (!voiceState?.channelId) return warnNotInSession();

		if (sessionName.length > 24)
			return request.reply({
				content: translator.getText('voiceSessionNameTooLong'),
				flags: MessageFlags.Ephemeral,
			});

		if (!sessionEmote)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionRenameInvalidEmoji'),
			});

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceState.channelId });
		if (!session) return warnNotInSession();

		const schemaMember = session.members.get(request.member.id);
		if (!schemaMember) return warnNotInSession();

		const sessionMember = new PureVoiceSessionMember(schemaMember);

		if (sessionMember.isGuest())
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('voiceSessionAdminOrModExpected'),
			});

		const { channelId: voiceId, roleId, nameChangedAt: nameChanged } = session;
		const now = new Date(Date.now());
		const renameUnblockDate = addMinutes(nameChanged ?? new Date(0), 20);

		if (isBefore(now, renameUnblockDate))
			return request.reply({
				content: translator.getText(
					'voiceSessionRenameTooSoon',
					getUnixTime(renameUnblockDate),
				),
			});

		session.nameChangedAt = new Date(Date.now());

		const guildChannels = request.guild.channels.cache;
		const guildRoles = request.guild.roles.cache;

		try {
			await Promise.all([
				session.save(),
				guildChannels
					.get(voiceId)
					?.setName(
						`${sessionEmote}【${sessionName}】`,
						translator.getText('voiceSessionReasonRename'),
					),
				guildRoles
					.get(roleId)
					?.setName(
						`${sessionEmote} ${sessionName}`,
						translator.getText('voiceSessionReasonRename'),
					),
			]);

			return request.reply({
				content: translator.getText('voiceSessionRenameSuccess'),
				flags: MessageFlags.Ephemeral,
			});
		} catch {
			return request.reply({
				content: translator.getText('voiceSessionRenameError'),
				flags: MessageFlags.Ephemeral,
			});
		}
	});

export default command;
