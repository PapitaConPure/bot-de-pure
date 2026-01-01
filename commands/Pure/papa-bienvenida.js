//const {} = require('discord.js'); //Librería de Discord.js
//const {} = require('../../data/config.json'); //Datos globales
const { dibujarBienvenida } = require('../../func'); //Funciones globales
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-bienvenida', flags)
	.setAliases('papa-welcome')
	.setDescription('Para simular una bienvenida.')
	.setExecution(async message => {
		return dibujarBienvenida(message.member, true);
	});

module.exports = command;
