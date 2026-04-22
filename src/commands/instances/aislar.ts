import type { GuildMember } from 'discord.js';
import { MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { Command, CommandOptionSolver, CommandOptions, CommandTags } from '../commons';
import { CommandPermissions } from '../commons/cmdPerms';

const perms = new CommandPermissions('ModerateMembers');

const options = new CommandOptions()
	.addParam('duración', 'NUMBER', 'para especificar el tiempo en minutos')
	.addParam('miembros', 'MEMBER', 'para aislar miembros', { poly: 'MULTIPLE', polymax: 8 });

const tags = new CommandTags().add('MOD');

const command = new Command(
	{
		es: 'aislar',
		en: 'timeout',
		ja: 'timeout',
	},
	tags,
)
	.setAliases('mutear', 'silenciar', 'mute', 'timeout', 'm')
	.setBriefDescription('Aisla miembros en el server por un cierto tiempo')
	.setLongDescription(
		'Aisla a uno o más `<miembros>` del servidor.',
		'Puedes especificar la `<duración>` en minutos, o ingresar 0 para revocar el aislamiento',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = await Translator.from(request.member);

		if (args.empty)
			return request.reply({
				flags: MessageFlags.Ephemeral,
				content: translator.getText('aislarNoTimeProvided'),
			});

		let duration: number | null | undefined = args.getNumber('duración');
		if (duration === undefined || Number.isNaN(+duration) || duration < 0)
			return request.reply({
				content: translator.getText('aislarInvalidTime'),
				flags: MessageFlags.Ephemeral,
			});

		if (duration === 0) duration = null;
		else duration = duration * 60e3;

		const members = CommandOptionSolver.asMembers(
			args.parsePolyParamSync('miembros', { regroupMethod: 'MENTIONABLES-WITH-SEP' }),
		);
		if (!members.length)
			return request.reply({
				content: translator.getText('aislarNoMembersMentioned'),
				flags: MessageFlags.Ephemeral,
			});

		if (members.some((member) => !member))
			await request.reply({ content: translator.getText('aislarSomeMembersWereInvalid') });

		const succeeded: GuildMember[] = [];
		const failed: GuildMember[] = [];

		const existingMembers = members.filter((member) => member) as GuildMember[];

		await Promise.all(
			existingMembers.map((member) =>
				member
					.timeout(duration, `Aislado por ${request.member.user.tag}`)
					.then(() => succeeded.push(member))
					.catch(() => failed.push(member)),
			),
		);

		if (!succeeded.length)
			return request.reply({ content: translator.getText('aislarNoUpdatedMembers') });

		const membersList = (members: GuildMember[]) =>
			members.map((member) => member.user.tag).join(', ');
		return request.reply({
			content: [
				duration
					? `✅ Se ha aislado a **${membersList(succeeded)}**`
					: `✅ Se ha revocado el aislamiento de **${membersList(succeeded)}**`,
				failed.length
					? `❌ No se ha podido actualizar a **${membersList(failed)}**. Puede que tenga(n) más poder que yo`
					: '',
			].join('\n'),
			flags: MessageFlags.Ephemeral,
		});
	});

export default command;
