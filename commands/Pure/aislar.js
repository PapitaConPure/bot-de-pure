const { GuildMember } = require('discord.js');
const { fetchMember, regroupText } = require('../../func');
const { CommandTags, CommandOptions, CommandManager } = require('../Commons/commands');
const { CommandPermissions } = require('../Commons/cmdPerms');
const { Translator } = require('../../internationalization');

const perms = new CommandPermissions('ModerateMembers');

const options = new CommandOptions()
	.addParam('duración', 'NUMBER', 'para especificar el tiempo en minutos')
	.addParam('miembros', 'MEMBER', 'para aislar miembros', { poly: 'MULTIPLE', polymax: 8 });
	
const flags = new CommandTags().add('MOD');
const command = new CommandManager('aislar', flags)
	.setAliases('mutear', 'silenciar', 'mute', 'timeout', 'm')
	.setBriefDescription('Aisla miembros en el server por un cierto tiempo')
	.setLongDescription(
		'Aisla a uno o más `<miembros>` del servidor.',
		'Puedes especificar la `<duración>` en minutos, o ingresar 0 para revocar el aislamiento',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.member);

		if(args.empty)
			return request.reply({ content: translator.getText('aislarNoTimeProvided'), ephemeral: true });

		let duration = args.getNumber('duración');
		if(isNaN(duration) || duration < 0)
			return request.reply({ content: translator.getText('aislarInvalidTime'), ephemeral: true });

		if(duration === 0) 
			duration = null;
		else 
			duration = duration * 60e3;

		args.ensureRequistified();
		const members = args.parsePolyParamSync('miembros', args.getMember);
		if(!members.length)
			return request.reply({ content: translator.getText('aislarNoMembersMentioned'), ephemeral: true });

		if(members.some(member => !member))
			await request.reply({ content: translator.getText('aislarSomeMembersWereInvalid') });

		const succeeded = /**@type {Array<GuildMember>}*/([]);
		const failed    = /**@type {Array<GuildMember>}*/([]);

		await Promise.all(members
			.filter(member => member)
			.map(member => member
				.timeout(duration, `Aislado por ${request.member.user.tag}`)
				.then(_ => succeeded.push(member))
				.catch(_ => failed.push(member))
		));
		
		if(!succeeded.length)
			return request.reply({ content: translator.getText('aislarNoUpdatedMembers') });
		
		const membersList = (/**@type {Array<GuildMember>}*/members) => members.map(member => member.user.tag).join(', ');
		return request.reply({
			content: [
				duration
					? `✅ Se ha aislado a **${membersList(succeeded)}**`
					: `✅ Se ha revocado el aislamiento de **${membersList(succeeded)}**`,
				failed.length
					? `❌ No se ha podido actualizar a **${membersList(failed)}**. Puede que tenga(n) más poder que yo`
					: '',
			].join('\n'),
			ephemeral: true,
		});
	});

module.exports = command;