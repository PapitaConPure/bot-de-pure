const {} = require('discord.js'); //Librería de Discord.js
const {} = require('../../localdata/config.json'); //Datos globales
const { dibujarBienvenida } = require('../../func.js'); //Funciones globales
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('PAPA');
const command = new CommandManager('papa-bienvenida', flags)
	.setAliases('papa-welcome')
	.setDescription('Para simular una bienvenida.')
	.setExecution(async message => {
		return dibujarBienvenida(message.member, true);
	});

module.exports = command;