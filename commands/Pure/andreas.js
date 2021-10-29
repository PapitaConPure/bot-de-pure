const andreasurl = 'https://i.imgur.com/GqepHtl.jpg';

module.exports = {
	name: 'andreas',
	aliases: [
		'andrea', 'akime', 'valt'
	],
	desc: 'Comando de discusión de Andreas',
	flags: [
		'meme'
	],
    experimental: true,

	/**@param {import("../Commons/typings").CommandRequest} request*/
	async execute(request, _, __ = false) {
		//Acción de comando
		return await request.reply({ files: [andreasurl] });
	},
};