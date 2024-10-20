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
		'Al usar un comando, sus `<parámetros>` y `--banderas` con parámetro esperan ciertos _(tipos)_ de valores',
		'No puedes usar un comando si escribes mal un valor. ¡Si es un Comando Slash, ni siquiera puedes enviarlo!',
		'Por ejemplo, a un parámetro `<duración>` de tipo _(número)_ no podrías escribirle "hola muy buenas tardes" porque fallaría.',
		'',
		'En la sección **"Opciones"** de la página de ayuda de cada comando se detalla el _(tipo)_ de valor esperado para cada opción',
		'',
		'* _(tipos)_ de valores comunes:**',
		'* _(número)_: valor numérico',
		'* _(texto)_: una o más palabras',
		'* _(U{mención/texto/id})_: usuario',
		'* _(M{mención/texto/id})_: miembro',
		'* _(R{mención/texto/id})_: rol',
		'* _(m{enlace/texto/id})_: mensaje',
		'* _(emote)_: emoji de servidor',
		'* _(enlace: https://a.b)_: estricto. Debe contener: `https://a.b`',
		'* _(número [2])_: 2 números seguidos',
		'',
		'Usa el menú de abajo para aprender más',
	);

module.exports = command;