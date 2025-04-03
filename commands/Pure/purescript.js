const { default: axios } = require('axios');
const { CommandTags } = require("../Commons/cmdTags");
const { CommandManager } = require("../Commons/cmdBuilder");
const { executeTuber, CURRENT_PS_VERSION } = require("../../systems/ps/common/executeTuber");
const { CommandOptions } = require("../Commons/cmdOpts");
const { ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { p_pure } = require("../../localdata/customization/prefixes");
const { tenshiColor } = require('../../localdata/config.json');
const { makeButtonRowBuilder } = require('../../tsCasts');

const psEditorButton = new ButtonBuilder()
	.setURL('https://papitaconpure.github.io/ps/')
	.setLabel(`Abrir editor de PuréScript (v${CURRENT_PS_VERSION})`)
	.setEmoji('1309359188929151098')
	.setStyle(ButtonStyle.Link);

const psDocsButton = new ButtonBuilder()
	.setURL('https://papitaconpure.github.io/ps-docs/')
	.setLabel(`Aprende PuréScript`)
	.setEmoji('📖')
	.setStyle(ButtonStyle.Link);

/**
 * 
 * @param {import("../Commons/cmdOpts").CommandOptionSolver} args 
 * @param {string?} rawArgs 
 */
async function getScriptString(args, rawArgs) {
	const file = args.getAttachment('archivo');

	if(file && file.name.toLowerCase().endsWith('.tuber')) {
		const importCode = async () => {
			const response = await axios.get(file.url);

			if(response.status !== 200)
				return {
					status: response.status,
					statusText: response.statusText,
					result: /**@type {null}*/(null),
				};
			
			return {
				status: 200,
				statusText: 'OK',
				result: /**@type {string}*/(response.data),
			};
		}

		return importCode();
	}

	let script;
	if(args.isInteractionSolver()) {
		script = args.getString('script').trim();
	} else {
		script = rawArgs
			.replace(/^```[A-Za-z0-9]*/, '')
			.replace(/```$/, '')
			.trim();
	}
	
	if(!script.length)
		return {
			status: 400,
			statusText: 'Se requiere que ingreses código PuréScript válido. Nótese que solo los Tubérculos pueden usar las características de registro y lectura Entradas de Usuario',
			result: /**@type {null}*/(null),
		};
	
	return {
		status: 200,
		statusText: 'OK',
		result: script,
	};
}

const options = new CommandOptions()
	.addParam('script', 'TEXT', 'para designar código PuréScript a ejecutar')
	.addParam('archivo', 'FILE', 'para importar código PuréScript a ejecutar');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('purescript', flags)
	.setAliases('puréscript', 'ps')
	.setBriefDescription('Interpreta y ejecuta código PuréScript')
	.setLongDescription(
		'Interpreta y ejecuta el código PuréScript ingresado',
		'',
		'Por mejor legibilidad, puedes usar algún coloreado (`arm` recomendado):',
		'> p!purescript \\`\\`\\`arm',
		'> ENVIAR "Hola mundo"',
		'> \\`\\`\\`',
		'',
		'Puedes usar el editor web de PuréScript [aquí](https://papitaconpure.github.io/ps/)',
		'Puedes leer la documentación de PuréScript [aquí](https://papitaconpure.github.io/ps-docs/)',
		`Última versión: **v${CURRENT_PS_VERSION}**`
	)
	.setOptions(options)
	.setExperimentalExecution(async function (request, args, rawArgs) {
		const helpString = `-# Usa \`${p_pure(request.guildId).raw}ayuda puréscript\` para más información`;
		const scriptResult = await getScriptString(args, rawArgs);

		if(scriptResult.status !== 200)
			return request.reply({
				content: `⚠️️ ${scriptResult.statusText}\n${helpString}`,
				embeds: [
					new EmbedBuilder()
						.setColor(tenshiColor)
						.setTitle('¿Nunca programaste en PuréScript?')
						.setDescription('¡Revisa la documentación oficial!'),
				],
				components: [makeButtonRowBuilder().addComponents(psEditorButton, psDocsButton)],
			});

		const script = scriptResult.result;

		/**@type {import('../../systems/ps/v1.1').Tubercle}*/
		const tuber = {
			id: null,
			author: request.userId,
			advanced: true,
			script,
			psVersion: CURRENT_PS_VERSION,
			saved: new Map(),
		};
		
		try {
			console.log(`Ejecutando PuréScript: ${tuber}`);
			await request.deferReply();
			await executeTuber(request, tuber, { isTestDrive: false, args: [] });
			console.log(`PuréScript ejecutado: ${tuber}`);
		} catch(error) {
			console.log('Ocurrió un error al ejecutar código PuréScript');
			console.error(error);
			const errorContent = { content: '❌ Hay un problema con el código que intentaste ejecutar' };

			if(request.wasReplied())
				return null;

			return request.wasDeferred()
				? request.editReply(errorContent)
				: request.reply(errorContent);
		}
	});

//@ts-expect-error
command.psEditorButton = psEditorButton;
//@ts-expect-error
command.psDocsButton = psDocsButton;

module.exports = command;
