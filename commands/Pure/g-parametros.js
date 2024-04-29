const { p_pure } = require('../../localdata/customization/prefixes.js');
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
		'Los `<parámetros>` se ingresan generalmente de forma ordenada, con el _(tipo)_ de valor que se pide',
		'',
		'En la ayuda de cada comando, en la sección **"Llamado"**, se detallan los nombres y el orden de sus parámetros',
		'Para notar el llamado de los comandos, se usa esta convención:',
		'`<parámetro>`: entrada obligatoria',
		'`<parámetro?>`: entrada opcional',
		'`<parámetro (...)>`: múltiples entradas (libre)',
		'`<parámetro (a,b,c)>`: múltiples entradas en sucesión para `(a)`, `(b)` y `(c)`',
		'`[<parám1><parám2>(...)]`: múltiples grupos de entradas ordenadas (los grupos pueden o no separarse por espacios)',
		'`[<parám1?>/<parám2?>]`: entradas intercambiables (en un solo puesto)',
		'',
		`Para aprender más sobre las \`--opciones\` de comando, usa \`${p_pure().raw}ayuda g-opciones\``,
		`Para ver sobre los _(tipos)_ de valores de parámetro, usa \`${p_pure().raw}ayuda g-tipos\``,
	);

module.exports = command;