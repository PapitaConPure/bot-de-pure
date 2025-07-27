const { makeGuideMenu } = require('../../wiki.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('GUIDE');
const command = new CommandManager('g-parametros', flags)
	.setAliases(
		'g-parámetros', 'g-argumentos',
		'g-parameters', 'g-arguments',
		'g-param', 'g-args',
	)
	.setLongDescription(
		'Algunos comandos pueden requerir `<parámetros>`',
		'Los parámetros generalmente se escriben en un cierto orden, y piden un cierto _(tipo)_ de valor',
		'',
		'En la sección **"Llamado"** de la ayuda de cada comando se detallan los nombres y el orden de sus parámetros',
		'',
		'El llamado de un comando se denota así:',
		'* `<parámetro>`: entrada obligatoria',
		'* `<parámetro?>`: entrada opcional',
		'* `<parámetro (...)>`: múltiples entradas (libre)',
		'* `<parámetro (a,b,c)>`: múltiples entradas en sucesión para `(a)`, `(b)` y `(c)`',
		'* `[<parám1><parám2>(...)]`: múltiples grupos de entradas ordenadas (los grupos pueden o no separarse por espacios)',
		'* `[<parám1?>/<parám2?>]`: entradas intercambiables (en un solo puesto)',
		'',
		'Usa el menú de abajo para aprender más',
	)
	.addWikiRow(makeGuideMenu);

module.exports = command;
