const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('GUIDE');
const command = new CommandManager('g-tipos', flags)
	.setAliases(
		'g-valores',
		'g-types', 'g-values',
		'g-t', 'g-v',
	)
	.setLongDescription(
		'Los `<parámetros>` y las `--opciones <propiedad>` de comando requieren _(tipos)_ de valores fijos',
		'Ingresar un `<parámetro>` o una `--bandera <propiedad>` con un _(tipo)_ diferente al esperado resultará en un ⚠️ **Error de entrada**',
		'',
		'En la página de ayuda de cada comando, en la sección **"Opciones"**, se detalla el _(tipo)_ de valor esperado para cada entrada',
		'',
		'**_(tipos)_ de valores comunes:**',
		'_(número)_: valor numérico',
		'_(texto)_: palabra/combinación de palabras',
		'_(emote)_: emote de server',
		'_(mención/texto/id)_: identificador de usuario/rol',
		'_(enlace: https://a.b)_: enlace. Debe contener: `https://a.b`',
		'_(número [2])_: 2 números seguidos',
		'',
		`Para aprender más sobre los \`--parametros\` de comando, usa \`${p_pure().raw}ayuda g-parametros\``,
		`Para aprender más sobre las \`--opciones\` de comando, usa \`${p_pure().raw}ayuda g-opciones\``,
	);

module.exports = command;