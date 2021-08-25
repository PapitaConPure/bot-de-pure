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

	execute(message, args) {
		//Acción de comando
		if(!args.length) {
			message.channel.send(':warning: Debes indicar un usuario.');
			return;
		}

		const hd = '682629889702363143'; //Hanged Doll
		const gd = message.channel.guild;
		const member = gd.members.cache.get(fetchUserID(args[0], gd, message.client));
		if(!member.roles.cache.some(r => r.id === hd)) {
			member.roles.add(hd);
			message.channel.send(`:moyai: Se ha colgado a **${ member.user.tag }**`);
			message.delete();
		} else {
			member.roles.remove(member.roles.cache.filter(r => r.id === hd));
			message.channel.send(`:otter: Se ha descolgado a **${ member.user.tag }**`);
		}
	}
};