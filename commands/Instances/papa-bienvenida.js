//const {} = require('discord.js'); //Librería de Discord.js
const { dibujarBienvenida } = require('../../func'); //Funciones globales
const { CommandTags, Command } = require('../Commons/');

const flags = new CommandTags().add('PAPA');
const command = new Command('papa-bienvenida', flags)
	.setAliases('papa-welcome')
	.setDescription('Para simular una bienvenida.')
	.setExecution(async message => {
		return dibujarBienvenida(message.member, true);
	});

module.exports = command;
