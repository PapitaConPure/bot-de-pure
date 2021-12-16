const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js');
const Canvas = require('canvas');
const Discord = require('discord.js');
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const maxexp = 30;
const options = new CommandOptionsManager()
	.addParam('posición', 	   'NUMBER', 'para especificar una celda a modificar', { poly: ['x','y'], optional: true })
	.addParam('emote', 		   'EMOTE',  'para especificar un emote a agregar',    { optional: true })
	.addFlag('h', 'horizontal', 		 'para usar la habilidad de línea horizontal')
	.addFlag('v', 'vertical', 			 'para usar la habilidad de línea vertical');

module.exports = {
	name: 'papa-eval',
	aliases: [],
	desc: [
		'Evalúa una función de JavaScript en el contexto de la función `execute` de un módulo de comando.',
		'```ts',
		'///Propiedades y objetos accesibles',
		'global: NodeRequire //Propiedades comunes en caché',
		'func: NodeRequire //Funciones comunes en caché',
		'Discord: NodeRequire //Librería discord.js',
		'Canvas: NodeRequire //Librería Node Canvas',
		'p_pure: {',
		`    raw: '${p_pure().raw}'`,
		`    regex: '${p_pure().regex.source}'`,
		'}',
		'module.exports = {',
		`    name: 'papa-eval'`,
		`    aliases: []`,
		`    desc: String`,
		`    flags?: [ 'papa' ]`,
		`    options: CommandOptionsManager`,
		`    experimental: false`, 
		'    execute(request: CommandRequest, args: CommandOptions, isSlash: false) //Usar esto en la elavuación puede resultar en un bucle infinito (función recursiva sin condición)',
		'}',
		'```',
		'Se pueden realizar modificaciones a las configuraciones comunes en la caché del proceso. No se puede acceder a la Base de Datos con esto'
	].join('\n'),
	flags: [
		'papa',
	],
	options: options,
	experimental: false,

	/**
	 * @param {import('../Commons/typings').CommandRequest} request 
	 * @param {import('../Commons/typings').CommandOptions} args 
	 * @param {Boolean} isSlash 
	 */
	async execute(request, args, isSlash = false) {
		//Acción de comando
		let embed = new Discord.MessageEmbed();
		try {
			const fnString = args.join();
			const returned = await eval(fnString);
			embed
				.setColor('DARK_VIVID_PINK')
				.setAuthor(`${request.guild.name} • ${request.channel.name}`, request.author.avatarURL({ dynamic: true }), request.url)
				.addField('Función ejecutada', `Retorno: ${ returned ?? (typeof returned) }`);
		} catch(error) {
			embed
				.setColor('#0000ff')
				.setAuthor(`${request.guild.name} • ${request.channel.name}`, request.author.avatarURL({ dynamic: true }), request.url)
				.addField('Ha ocurrido un error al ingresar un comando', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
		}
		await request.channel.send({
			content: 'Terminó la evaluación de la función',
			embeds: [embed],
		});
	}
};