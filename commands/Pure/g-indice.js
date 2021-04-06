module.exports = {
	name: 'g-indice',
	aliases: [
		'g-índice', 
		'g-index',
		'g-ind', 'g-i'
	],
	desc: 'Esta es la página de introducción de Bot de Puré. Si estás tan confundido como para nisiquiera saber del todo cómo usar `p!ayuda`, esto puede serte útil\n\n' +
		'En general, usas comandos para hacer cosas y en algunos casos querrás ingresar `<parámetros>` y/o `--banderas`\n' +
		'Los `<parámetros>` y las `--banderas` son solo 2 formas de similares y a la vez diferentes manipular un comando\n' +
		'Basándose en conveniencia de uso, algunos comportamientos se definirán con `<uno>` o con `--otro`.\n\n' +
		'Referencia:\n' +
		'`p!ayuda g-parametros`: introducción a `<parámetros>`\n' +
		'`p!ayuda g-opciones`: introducción a opciones y `--banderas`\n' +
		'`p!ayuda g-tipos`: introducción a _(tipos)_ y definiciones de _(tipos)_\n\n' +
		'_"¿Quién necesita Wikipedia cuando tenés un Bot chatarra?" ~Papita_',
	flags: ['guide']
};