const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js');
const axios = require('axios');
const Canvas = require('canvas');
const Discord = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager } = require('../Commons/cmdOpts');
const { fetchFlag } = require('../../func.js');

const options = new CommandOptionsManager()
	.addFlag('d', ['del', 'delete'], 'para eliminar el mensaje original');

module.exports = {
	name: 'papa-eval',
	aliases: [],
	desc: [
		'Evalúa una función de JavaScript en el contexto de la función `execute` de un módulo de comando.',
		'```ts',
		'global //Propiedades comunes en caché',
		'func //Funciones comunes en caché',
		'Discord //Librería discord.js',
		'Canvas //Librería Node Canvas',
		'p_pure: {',
		`  raw: '${p_pure().raw}'`,
		`  regex: /${p_pure().regex.source}/`,
		'}',
		`name: 'papa-eval' //Nombre del comando`,
		`aliases: [] //Alias del comando`,
		`brief: String //Descripción breve del comando (para /comandos)`,
		`desc: String //Descripción del comando`,
		`flags?: [ 'papa' ] //Flags del comando, como COMMON y MOD`,
		`options: CommandOptionsManager //<banderas> y --flags`,
		`experimental: false //Forma experimental de interpretar cmdos.`,
		'execute(request: CommandRequest, args: CommandOptions, isSlash: false) //Usar esto en la elavuación puede resultar en un bucle infinito (función recursiva sin condición)',
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
		try {
			const fnString = args.join(' ');
			console.log(fnString);
			await eval(fnString);
			await request.react('✅');
		} catch(error) {
			const embed = new Discord.MessageEmbed()
				.setColor('#0000ff')
				.setAuthor({ name: `${request.guild.name} • ${request.channel.name}`, iconURL: request.author.avatarURL({ dynamic: true }), url: request.url })
				.addField('Ha ocurrido un error al ingresar un comando', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
			await request.channel.send({ embeds: [embed] });
		}
		fetchFlag(args, { ...options.flags.get('del').structure, callback: request.delete });
	}
};