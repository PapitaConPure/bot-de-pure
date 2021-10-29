const celesteurl = 'https://i.imgur.com/h9L6qy9.png';

module.exports = {
	name: 'celeste',
	desc: 'La versión que nunca te contaron del comando de Sassa',
	flags: [
		'meme',
		'hourai'
	],
	experimental: true,

	/**@param {import("../Commons/typings").CommandRequest} request*/
	async execute(request, _, __) {
		//Acción de comando
		return await request.reply({ files: [celesteurl] });
	}
};