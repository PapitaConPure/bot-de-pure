import { CommandTags } from '../Commons/cmdTags';
import { Command } from '../Commons/cmdBuilder';
import { executeTuber, CURRENT_PS_VERSION } from '../../systems/ps/common/executeTuber';
import { CommandOptions } from '../Commons/cmdOpts';
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { p_pure } from '../../utils/prefixes';
import { tenshiColor } from '../../data/globalProps';
import { makeButtonRowBuilder } from '../../utils/tsCasts';
import { Tubercle } from '../../systems/ps/v1.1';
import axios from 'axios';

export const psEditorButton = new ButtonBuilder()
	.setURL('https://papitaconpure.github.io/ps/')
	.setLabel(`Abrir editor de PuréScript (v${CURRENT_PS_VERSION})`)
	.setEmoji('1309359188929151098')
	.setStyle(ButtonStyle.Link);

export const psDocsButton = new ButtonBuilder()
	.setURL('https://papitaconpure.github.io/ps-docs/')
	.setLabel(`Aprende PuréScript`)
	.setEmoji('📖')
	.setStyle(ButtonStyle.Link);

async function getScriptString(args: import("../Commons/cmdOpts").CommandOptionSolver, rawArgs?: string) {
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

	let script: string;
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
const command = new Command('purescript', flags)
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
	.addWikiRow(
		psEditorButton,
		psDocsButton,
	)
	.setOptions(options)
	.setExecution(async function (request, args, rawArgs) {
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

		const tuber: Tubercle = {
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

export default command;
