const {} = require('discord.js'); //Librería de Discord.js
const {} = require('../../localdata/config.json'); //Datos globales
const { dibujarBienvenida } = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'papa-bienvenida',
	aliases: [
		'papa-welcome'
	],
	desc: 'Para simular una bienvenida.',
	flags: [
		'papa'
	],

	/**
	 * @param {import('discord.js').Message} message
	 * @param {import('../Commons/typings').CommandOptions} args
	 */
	async execute(message, args) {
        dibujarBienvenida(message.member, true);
	}
};