const { makeGuideMenu } = require('../../systems/others/wiki.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('GUIDE');
const command = new CommandManager('g-índice', flags)
	.setAliases(
		'g-indice', 
		'g-index',
		'g-ind', 'g-i',
	)
	.setLongDescription(
		'👋 ¡Buenas!',
		'',
		'Los comandos de Bot de Puré vienen en 2 formas:',
		'* **Comando de Mensaje** — se usan con `p!` al inicio de un mensaje',
		'* **Comandos Slash** — se usan como un comando convencional, con `/`',
		'',
		'Los comandos suelen tener **opciones**: `<parámetros>` y/o `--banderas`.',
		'Los parámetros y las banderas son dos formas similares y a la vez diferentes manipular un comando.',
		'En Comandos Slash no hay mucha diferencia, pero con Comandos de Mensaje los parámetros siguen un cierto orden mientras que las banderas pueden indicarse como sea',
	)
	.addWikiRow(makeGuideMenu);

module.exports = command;
