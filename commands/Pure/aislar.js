const { GuildMember } = require('discord.js');
const { fetchMember, regroupText } = require('../../func');
const { CommandMetaFlagsManager, CommandOptionsManager, CommandManager } = require('../Commons/commands');
const { CommandPermissions } = require('../Commons/cmdPerms');

const perms = new CommandPermissions('ModerateMembers');

const options = new CommandOptionsManager()
	.addParam('duración', 'NUMBER', 'para especificar el tiempo en minutos')
	.addParam('miembros', 'USER', 'para aislar miembros', { poly: 'MULTIPLE', polymax: 8 });
	
const flags = new CommandMetaFlagsManager().add('MOD');
const command = new CommandManager('aislar', flags)
	.setAliases('mutear', 'silenciar', 'mute', 'timeout', 'm')
	.setBriefDescription('Aisla miembros en el server por un cierto tiempo')
	.setLongDescription(
		'Aisla a uno o más `<miembros>` del servidor.',
		'Puedes especificar la `<duración>` en minutos, o ingresar 0 para revocar el aislamiento',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args, isSlash) => {
		if(!request.guild.members.me.permissions.has('ModerateMembers'))
			return request.reply({ content: '⚠️ ¡No tengo permiso para hacer eso!', ephemeral: true });

		if(!isSlash && !args.length)
			return request.reply({ content: '⚠️ Debes indicar la duración del castigo en minutos', ephemeral: true });

		let duration = isSlash ? args.getNumber('duración') : +(args.shift());
		if(duration === undefined || duration < 0 || isNaN(duration))
			return request.reply({ content: '⚠️ Debes especificar la duración del aislamiento en minutos\nIngresa 0 para revocarlo', ephemeral: true });

		if(duration === 0) 
			duration = null;
		else 
			duration = duration * 60e3;
		
		if(!isSlash && !args.length)
			return request.reply({ content: '⚠️ Debes indicar un usuario luego de la duración', ephemeral: true });

		/**@type {Array<GuildMember>}*/
		const members = isSlash
			? options.fetchParamPoly(args, 'miembros', args.getMember, [])
			: regroupText(args).map(data => fetchMember(data, request)).filter(member => member);
		
		if(!members.length)
			return request.reply({ content: '⚠️ Debes mencionar al menos un miembro a aislar', ephemeral: true });

		const succeeded = [];
		const failed = [];

		await Promise.all(members.map(member => 
			member.timeout(duration, `Aislado por ${request.member.user.tag}`)
			.then(_ => succeeded.push(member))
			.catch(_ => failed.push(member))
		));
		
		if(!succeeded.length)
			return request.reply({ content: '⚠️ No pude actualizar ninguno de los miembros mencionados. Revisa que tenga permisos para administrar miembros' });
		
		const membersList = members => members.map(member => member.user.tag).join(', ');
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