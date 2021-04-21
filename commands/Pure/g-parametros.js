const { p_pure } = require('../../config.json');

module.exports = {
	name: 'g-parametros',
	aliases: [
		'g-parámetros', 'g-argumentos',
		'g-parameters', 'g-arguments',
		'g-param', 'g-args'
	],
	desc: 'Algunos comandos requieren una descripción más exacta de lo que quieres hacer con ellos. Para esto, están los `<parámetros>` y las `--opciones`\n\n' +
		'Los `<parámetros>` se ingresan generalmente de forma ordenada, con el _(tipo)_ de valor que se pide\n\n' +
		'En la ayuda de cada comando, en la sección **"Llamado"**, se detallan los nombres y el orden de sus parámetros\n' +
		'Para notar el llamado de los comandos, se usa esta convención:\n' +
		'`<parámetro>`: entrada obligatoria\n' +
		'`<parámetro?>`: entrada opcional\n' +
		'`<parámetro (...)>`: múltiples entradas (libre)\n' +
		'`<parámetro (a,b,c)>`: múltiples entradas en sucesión para `(a)`, `(b)` y `(c)`\n' +
		'`[<parám1><parám2>(...)]`: múltiples grupos de entradas ordenadas (los grupos pueden o no separarse por espacios)\n' +
		'`[<parám1?>/<parám2?>]`: entradas intercambiables (en un solo puesto)\n\n' +
		`Para aprender más sobre las \`--opciones\` de comando, usa \`${p_pure}ayuda g-opciones\`\n` +
		`Para ver sobre los _(tipos)_ de valores de parámetro, usa \`${p_pure}ayuda g-tipos\``,
	flags: ['guide']
};