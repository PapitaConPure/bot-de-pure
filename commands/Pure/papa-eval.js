const Discord = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');

const options = new CommandOptions()
	.addFlag('d', ['del', 'delete'], 'para eliminar el mensaje original');
const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-eval', flags)
	.setDescription(
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
		`options: CommandOptions //<banderas> y --flags`,
		`experimental: false //Forma experimental de interpretar cmdos.`,
		'execute(request: CommandRequest, args: CommandOptions, isSlash: false) //Usar esto en la elavuación puede resultar en un bucle infinito (función recursiva sin condición)',
		'```',
		'Se pueden realizar modificaciones a las configuraciones comunes en la caché del proceso. No se puede acceder a la Base de Datos con esto',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		if(request.isInteraction)
			return request.reply({ content: '❌ No permitido con comandos Slash.' });

		const message = request.inferAsMessage();

		const deleteAfter = args.parseFlag('del');
		try {
			const fnString = args.rawArgs;
			console.log(fnString);
			await eval(fnString);
			await message.react('✅');
		} catch(error) {
			const embed = new Discord.EmbedBuilder()
				.setColor(0x0000ff)
				.setAuthor({ name: `${message.guild.name} • ${message.channel.name}`, iconURL: message.author.avatarURL(), url: message.url })
				.addFields({
					name: 'Ha ocurrido un error al ingresar un comando',
					value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``,
				});
			await message.reply({ embeds: [embed] });
		}
		if(deleteAfter)
			message.delete();
	});

module.exports = command;
