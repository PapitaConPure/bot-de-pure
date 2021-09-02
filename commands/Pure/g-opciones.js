const { p_pure } = require('../../localdata/config.json');

module.exports = {
	name: 'g-opciones',
	aliases: [
		'g-banderas',
		'g-opt', 'g-flags'
	],
	desc: 'Algunos comandos requieren más detalles de lo que quieres hacer. Para esto, están los `<parámetros>` y las `--opciones`\n\n' +
		'Las opciones (o banderas) llevan prefijos con `-`, y pueden simbolizar acciones directas o propiedades\n\n' +
		'En la página de ayuda de cada comando, en la sección **"Opciones"**, se encuentran los nombres y detalles de los `<parámetros>` y `--banderas` ingresables\n' +
		'Las banderas tienen identificadores únicos que pueden ser cortos o largos. Las banderas cortas pueden apilarse en un solo prefijo\n' +
		'`-b`: bandera corta\n' +
		'`--bandera`: bandera larga\n' +
		'`-bcd`: banderas `b`, `c` y `d` apiladas\n\n' +
		'Algunas banderas actúan como propiedades y requieren un valor:\n' +
		'`--objetivo <usuario>`: objetivo = `<usuario>`\n' +
		'`-xy <número>`: x = y = `<número>`\n' +
		`Para aprender más sobre los \`--parametros\` de comando, usa \`${p_pure.raw}ayuda g-parametros\`\n` +
		`Para ver sobre los _(tipos)_ de valores de parámetro, usa \`${p_pure.raw}ayuda g-tipos\``,
	flags: ['guide']
};