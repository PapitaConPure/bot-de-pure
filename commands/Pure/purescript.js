const { CommandTags } = require("../Commons/cmdTags");
const { CommandManager } = require("../Commons/cmdBuilder");
const { executeTuber } = require("../../systems/purescript");
const { CommandOptions } = require("../Commons/cmdOpts");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { p_pure } = require("../../localdata/customization/prefixes");
const { tenshiColor } = require('../../localdata/config.json');

const psDocsButton = new ButtonBuilder()
	.setURL('https://drive.google.com/drive/folders/1wv2-n4J5SSZNH9oQ5gNEPpptm7rNFEnV?usp=share_link')
	.setLabel('Aprende PuréScript')
	.setEmoji('📖')
	.setStyle(ButtonStyle.Link);

/**
 * 
 * @param {Boolean | undefined} isSlash 
 * @param {import("../Commons/typings").CommandOptions} args 
 * @param {String} rawArgs 
 */
function getScriptString(isSlash, args, rawArgs) {
	if(isSlash)
		return args.getString('script');
	
	let script = rawArgs
		.replace(/^```[A-Za-z0-9]*/, '')
		.replace(/```$/, '');
	return script;
}

const options = new CommandOptions()
	.addParam('script', 'TEXT', 'para designar código PuréScript a ejecutar');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('purescript', flags)
	.setAliases('puréscript', 'ps')
	.setBriefDescription('Interpreta y ejecuta código PuréScript')
	.setLongDescription(
		'Interpreta y ejecuta el código PuréScript ingresado',
		'',
		'Por facilidad de uso, puedes usar formato de código (.arm recomendado):',
		'> p!purescript \\`\\`\\`arm',
		'> ENVIAR "Hola mundo"',
		'> \\`\\`\\`',
		'',
		'Puedes leer o descargar la documentación de PuréScript desde [aquí](https://drive.google.com/drive/folders/1wv2-n4J5SSZNH9oQ5gNEPpptm7rNFEnV?usp=share_link) (~3MiB)',
	)
	.setOptions(options)
	.setExecution(async function (request, args, isSlash, rawArgs) {
		const helpString = `Usa \`${p_pure(request.guildId).raw}ayuda puréscript\` para más información`;

		/**@type {String}*/
		const script = getScriptString(isSlash, args, rawArgs);
		if(!script?.length)
			return request.reply({
				content: `⚠️️ Se requiere que ingreses código PuréScript válido. Nótese que solo los Tubérculos pueden usar las características de registro y lectura Entradas de Usuario\n${helpString}`,
				embeds: [
					new EmbedBuilder()
						.setColor(tenshiColor)
						.setTitle('¿Nunca programaste en PuréScript?')
						.setDescription('¡Revisa la documentación oficial!'),
				],
				components: [new ActionRowBuilder().addComponents(psDocsButton)],
			});

		/**@type {import("../../systems/purescript").Tubercle}*/
		const tuber = {
			author: request.userId,
			script,
		};
		
		try {
			console.log('Ejecutando PuréScript:',tuber);
			if(isSlash) await request.deferReply();
			await executeTuber(request, tuber, { isSlash });
			console.log('PuréScript ejecutado:', tuber);
		} catch(error) {
			console.log('Ocurrió un error al ejecutar código PuréScript');
			console.error(error);
			const errorContent = { content: '❌ Hay un problema con el código que intentaste ejecutar' };
			return request.deferred
				? request.editReply(errorContent)
				: request.reply(errorContent);
		}
	});

module.exports = command;