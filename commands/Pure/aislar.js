const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { fetchMember, regroupText } = require('../../func');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
	.addParam('duración', 'NUMBER', 'para especificar el tiempo en minutos')
	.addParam('miembros', 'USER', 'para aislar miembros', { poly: 'MULTIPLE', polymax: 8 });

module.exports = {
	name: 'aislar',
	aliases: [
		'mutear', 'silenciar',
		'mute', 'timeout',
		'm',
	],
	brief: 'Aisla miembros en el server por un cierto tiempo',
	desc: 'Aisla a uno o más `<miembros>` del servidor.\n' +
		  'Puedes especificar la `<duración>` en minutos, o ingresar 0 para revocar el aislamiento',
	flags: [
		'mod',
	],
	options,
	callx: options.callSyntax,
	experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		if(!isSlash && !args.length)
			return await request.reply({ content: '⚠ Debes indicar un usuario.', ephemeral: true });

		const duration = isSlash ? args.getNumber('duración') : args.shift();
		if(duration === undefined || duration < 0)
			return await request.reply({ content: '⚠ Debes especificar la duración del aislamiento en minutos\nIngresa 0 para revocarlo', ephemeral: true });

		const members = isSlash
			? options.fetchParamPoly(args, 'miembros', args.getMember, [])
			: regroupText(args).map(data => fetchMember(data, request));
		if(!members.length)
			return await request.reply({ content: '⚠ Debes mencionar al menos un miembro a aislar', ephemeral: true });

		const succeeded = [];
		const failed = [];

		await Promise.all(members.map(member => 
			member.timeout(duration * 60e3, `Aislado por ${request.member.user.tag}`)
			.then(_ => succeeded.push(member))
			.catch(_ => failed.push(member))
		));
		
		if(!succeeded.length)
			return await request.reply({ content: '⚠ No pude actualizar ninguno de los miembros mencionados. Revisa que tenga permisos para administrar miembros' });
		
		const membersList = members => members.map(member => member.user.tag).join(', ');
		return await request.reply({
			content: [
				duration > 0
					? `✅ Se ha aislado a **${membersList(succeeded)}**`
					: `✅ Se ha revocado el aislamiento de **${membersList(succeeded)}**`,
				failed.length
					? `❌ No se ha podido actualizar a **${membersList(failed)}**. Puede que tengan más poder que yo`
					: ''
			].join('\n'),
			ephemeral: true,
		});
	},
};