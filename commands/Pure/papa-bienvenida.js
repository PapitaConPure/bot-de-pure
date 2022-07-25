const {} = require('discord.js'); //Librería de Discord.js
const {} = require('../../localdata/config.json'); //Datos globales
const { dibujarBienvenida } = require('../../func.js'); //Funciones globales
const { CommandMetaFlagsManager } = require('../Commons/commands');

module.exports = {
	name: 'papa-bienvenida',
	aliases: [
		'papa-welcome'
	],
	desc: 'Para simular una bienvenida.',
	flags: new CommandMetaFlagsManager().add('PAPA'),

	/**
	 * @param {import('discord.js').Message} message
	 * @param {import('../Commons/typings').CommandOptions} args
	 */
	async execute(message, args) {
        dibujarBienvenida(message.member, true);
	}
};