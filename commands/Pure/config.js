const {  } = require('discord.js'); //Integrar discord.js
const { CommandOptionsManager, CommandMetaFlagsManager } = require("../Commons/commands");

const options = new CommandOptionsManager()
	.addParam('comando', 'TEXT', 'para especificar el comando a configurar');

module.exports = {
	name: 'config',
	aliases: [
		'configs'
	],
	options,
	desc: 'Para configurar Preferencias de usuario',
	flags: new CommandMetaFlagsManager().add(
		'COMMON',
		'MAINTENANCE',
	),
    experimental: true,
	
	/**
	 * @param {import("../Commons/typings").CommandRequest} request
	 * @param {import('../Commons/typings').CommandOptions} args
	 * @param {Boolean} isSlash
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		return request.reply({ content: 'ola' });
	}
};