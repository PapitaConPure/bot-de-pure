module.exports = {
	name: 'g-parametros',
	aliases: [
		'g-parámetros', 'g-argumentos',
		'g-parameters', 'g-arguments',
		'g-param', 'g-args'
	],
	desc: 'Algunos comandos requieren que facilites una descripción más detallada de lo que quieres hacer con ellos. Para esto, están los `<parámetros>` y las `--opciones`\n\n' +
		'Los parámetros se ingresan de forma bastante directa, generalmente en orden, con el _(tipo)_ de valor que se pide\n\n' +
		'En la página de ayuda de cada comando, en la sección **"Llamado"**, se detallan los nombres y el orden de los parámetros a disposición\n' +
		'Para notar el correcto llamado de los comandos, se usa la siguiente convención:\n' +
		'`<parámetro>`: entrada obligatoria\n' +
		'`<parámetro?>`: entrada opcional\n' +
		'`<parámetro (...)>`: múltiples entradas (libre)\n' +
		'`<parámetro (a,b,c)>`: múltiples entradas seguidas para los aspectos `(a)`, `(b)` y `(c)` del parámetro\n\n' +
		'Para aprender más sobre las `--opciones` de un comando, usa `p!ayuda g-opciones`\n' +
		'Para ver sobre los _(tipos)_ de valores de parámetro, usa `p!ayuda g-tipos`',
	flags: ['guide']
};