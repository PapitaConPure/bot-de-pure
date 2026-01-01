const { makeGuideMenu } = require('../../systems/others/wiki.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('GUIDE');
const command = new CommandManager('g-opciones', flags)
	.setAliases(
		'g-banderas',
		'g-opt', 'g-flags',
	)
	.setLongDescription(
		'Algunos comandos pueden usar `--banderas`',
		'Las banderas indican acciones y/o propiedades optativas de un comando. Tienen nombres cortos y/o largos.',
		'* Los nombres cortos son 1 sola letra',
		'* Los nombres largos tienen varias letras',
		'',
		'En la sección **"Opciones"** de la página de ayuda de cada comando están todos sus `<parámetros>` y `--banderas`.',
		'Cuando usas un comando, puedes indicar algunas de sus banderas escribiendo sus nombres.',
		'Las banderas cortas llevan un `-` por delante y pueden apilarse:',
		'* `-b` — bandera corta',
		'* `-bcd` — banderas `b`, `c` y `d` apiladas',
		'Las banderas largas llevan un `--` por delante:',
		'* `--bandera` — bandera larga',
		'* `--bcd` — una sola bandera llamada `bcd`',
		'',
		'Algunas banderas pueden tomar valores, como si fueran parámetros. Por ejemplo:',
		'* `--objetivo <usuario>` — `objetivo` = `<usuario>`',
		'* `-xy <número>` — `x` = `y` = `<número>`',
		'',
		'Usa el menú de abajo para aprender más',
	)
	.addWikiRow(makeGuideMenu);

module.exports = command;
