const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const flags = new CommandMetaFlagsManager().add('GUIDE');
const command = new CommandManager('g-opciones', flags)
	.setAliases(
		'g-banderas',
		'g-opt', 'g-flags',
	)
	.setLongDescription(
		'Algunos comandos pueden usar `--opciones`',
		'Las opciones (o banderas) comienzan con un prefijo `-`, y pueden significar acciones directas o propiedades',
		'',
		'En la página de ayuda de cada comando, en la sección **"Opciones"**, se encuentran los nombres y detalles de los `<parámetros>` y `--banderas` ingresables',
		'Las banderas tienen nombres únicos que pueden ser cortos o largos. Las banderas cortas pueden apilarse en un solo prefijo, las largas no',
		'`-b`: bandera corta',
		'`--bandera`: bandera larga',
		'`-bcd`: banderas `b`, `c` y `d` apiladas',
		'',
		'Las banderas-propiedad se escriben así:',
		'`--objetivo <usuario>`: objetivo = `<usuario>`',
		'`-xy <número>`: x = y = `<número>`',
		`Para aprender más sobre los \`--parametros\` de comando, usa \`${p_pure().raw}ayuda g-parametros\``,
		`Para ver sobre los _(tipos)_ de valores de parámetro, usa \`${p_pure().raw}ayuda g-tipos\``,
	);

module.exports = command;