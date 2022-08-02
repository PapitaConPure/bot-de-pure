const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('GUIDE');
const command = new CommandManager('g-índice', flags)
	.setAliases(
		'g-indice', 
		'g-index',
		'g-ind', 'g-i',
	)
	.setLongDescription(
		`Esta es la página de introducción de Bot de Puré. Si ni sabes del todo cómo usar \`${p_pure().raw}ayuda\`, esto puede serte útil`,
		'',
		'En general, usas comandos para hacer cosas y en algunos casos querrás ingresar `<parámetros>` y/o `--banderas`',
		'Los `<parámetros>` y las `--banderas` son solo 2 formas de similares y a la vez diferentes manipular un comando',
		'Basándose en conveniencia de uso, algunos comportamientos se definirán con `<uno>` u con `--otro`.',
		'',
		'Referencia:',
		`\`${p_pure().raw}ayuda g-parametros\`: introducción a \`<parámetros>\``,
		`\`${p_pure().raw}ayuda g-opciones\`: introducción a opciones y \`--banderas\``,
		`\`${p_pure().raw}ayuda g-tipos\`: introducción a _(tipos)_ y definiciones de _(tipos)_`,
		'',
		'_"¿Quién necesita Wikipedia cuando tenés un Bot chatarra?" ~Papita_',
	);

module.exports = command;