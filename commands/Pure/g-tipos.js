const { p_pure } = require('../../localdata/config.json');

module.exports = {
	name: 'g-tipos',
	aliases: [
		'g-valores',
		'g-types', 'g-values',
		'g-t', 'g-v'
	],
	desc: 'Los `<parámetros>` y las `--opciones <...>` de comando requieren _(tipos)_ de valores fijos\n' +
		'Ingresar un `<parámetro>` o una `--bandera <...>` con un _(tipo)_ diferente al esperado resultará en un :warning: **error de entrada**\n\n' +
		'En la página de ayuda de cada comando, en la sección **"Opciones"**, se detalla el _(tipo)_ de valor esperado para cada entrada\n\n' +
		'_(tipos)_ de valores comunes:\n' +
		'_(número)_: valor numérico\n' +
		'_(texto)_: palabra/combinación de palabras\n' +
		'_(emote)_: emote de server\n' +
		'_(mención/texto/id)_: identificador de usuario/rol\n' +
		'_(enlace: https://a.b)_: enlace. Debe contener: `https://a.b`\n' +
		'_(número [2])_: 2 números seguidos`\n\n' +
		`Para aprender más sobre los \`--parametros\` de comando, usa \`${p_pure}ayuda g-parametros\`\n` +
		`Para aprender más sobre las \`--opciones\` de comando, usa \`${p_pure}ayuda g-opciones\`\n`,
	flags: ['guide']
};