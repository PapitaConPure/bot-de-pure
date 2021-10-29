const violojiaurl = 'https://i.imgur.com/eXS3nxn.png';

module.exports = {
	name: 'cromosomas',
	aliases: [
		'biología', 'biologia', 'violojía', 'violojia',
		'biology', 'violoyi'
	],
	desc: 'Comando de VIOLOJÍA de Mabel',
	flags: [
		'meme',
		'hourai',
	],
	experimental: true,

	/**@param {import("../Commons/typings").CommandRequest} request*/
	async execute(request, _, __) {
		//Acción de comando
		return await request.reply({ files: [violojiaurl] });
	},
};