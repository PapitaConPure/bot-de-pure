const { fetchUserID } = require('../../func');

module.exports = {
	name: 'colgar',
	aliases: [
		'mutear', 'silenciar',
		'mute', 'hang', 'hanged',
		'm', 'h'
	],
	desc: 'Comando de Hourai para asignar rápidamente el rol __Hanged Doll__ a un `usuario`.\n' +
		  'Usarlo con alguien que ya está colgado lo descolgará, así que ten cuidado.',
	flags: [
		'mod',
		'hourai'
	],
	options: [
		'`<usuario>` _(mención/texto/id)_ para aplicar Hanged Doll a un usuario'
	],
	callx: '<usuario>',

	async execute(message, args) {
		//Acción de comando
		const { client, guild, channel } = message;
		if(!args.length) {
			channel.send({ content: ':warning: Debes indicar un usuario.' });
			return;
		}

		const hd = '682629889702363143'; //Hanged Doll
		channel.send(`\`${gd}\``);
		const member = guild.members.cache.get(fetchUserID(args.join(' '), { guild: guild, client: client }));
		if(!member.roles.cache.some(r => r.id === hd)) {
			member.roles.add(hd);
			channel.send({ content: `:moyai: Se ha colgado a **${ member.user.tag }**` });
			message.delete();
		} else {
			member.roles.remove(member.roles.cache.filter(r => r.id === hd));
			channel.send({ content: `:otter: Se ha descolgado a **${ member.user.tag }**` });
		}
	}
};