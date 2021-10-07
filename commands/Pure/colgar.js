const { fetchUserID } = require('../../func');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const options = new CommandOptionsManager()
	.addParam('usuario', 'USER', 'para aplicar Hanged Doll a un usuario');

module.exports = {
	name: 'colgar',
	aliases: [
		'mutear', 'silenciar', 'castrar',
		'mute', 'hang', 'hanged',
		'm', 'h'
	],
	desc: 'Comando de Hourai para asignar rápidamente el rol __Hanged Doll__ a un `usuario`.\n' +
		  'Usarlo con alguien que ya está colgado lo descolgará, así que ten cuidado.',
	flags: [
		'mod',
		'hourai'
	],
	options,
	callx: '<usuario>',

	async execute(message, args) {
		//Acción de comando
		const { client, guild, channel } = message;
		if(!args.length) {
			channel.send({ content: ':warning: Debes indicar un usuario.' });
			return;
		}

		const hd = '682629889702363143'; //Hanged Doll
		const member = guild.members.cache.get(fetchUserID(args.join(' '), { guild: guild, client: client }));
		if(!member) {
			message.delete();
			const sent = await channel.send({ content: ':warning: La gente que no existe por lo general no tiene cuello <:invertido:720736131368485025>' });
			setTimeout(() => sent.delete(), 1000 * 5);
			return;
		}

		if(!member.roles.cache.has(hd)) {
			member.roles.add(hd, `Colgado por ${message.author.tag}`);
			message.delete();
			channel.send({ content: `:moyai: Se ha colgado a **${ member.user.tag }**` });
		} else {
			member.roles.remove(member.roles.cache.filter(r => r.id === hd));
			message.delete();
			channel.send({ content: `:otter: Se ha descolgado a **${ member.user.tag }**` });
		}
	}
};