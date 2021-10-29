const aquaurl = 'https://tenor.com/bF5ID.gif';

module.exports = {
	name: 'aqua',
	aliases: [
		'minato', 'onion'
	],
	desc: 'Comando de cachetitos de Minato Aqua',
	flags: [
		'meme'
	],
	experimental: true,

	/**@param {import("../Commons/typings").CommandRequest} request*/
	async execute(request, _, __) {
		//Acción de comando
		return await request.reply({ content: aquaurl });
	},
};