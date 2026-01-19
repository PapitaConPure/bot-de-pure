/* eslint-disable @typescript-eslint/no-unused-vars */

import { p_pure } from '../../utils/prefixes';
import { CommandOptions, CommandTags, Command } from '../Commons/';
import Discord from 'discord.js';

import * as GlobalProps from '../../data/globalProps';
import * as func from '../../func';
import Canvas from '@napi-rs/canvas';

const options = new CommandOptions()
	.addFlag('d', [ 'del', 'delete' ], 'para eliminar el mensaje original');

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-eval', tags)
	.setDescription(
		'Evalúa una función de JavaScript en el contexto de la función `execute` de un módulo de comando.',
		'```ts',
		'GlobalProps //Propiedades comunes en caché',
		'func //Funciones comunes en caché',
		'Discord //Librería discord.js',
		'Canvas //Librería Node Canvas',
		'p_pure: () => {',
		`  raw: '${p_pure().raw}'`,
		`  regex: /${p_pure().regex.source}/`,
		'}',
		`name: 'papa-eval' //Nombre del comando`,
		`aliases: string[] //Alias del comando`,
		`brief: string //Descripción breve del comando (para /comandos)`,
		`desc: string //Descripción del comando`,
		`flags?: [ 'papa' ] //Flags del comando, como COMMON y MOD`,
		`options: CommandOptions //<banderas> y --flags`,
		'request: ComplexCommandRequest //El mensaje o interacción que desencadenó este comando',
		'args: CommandOptionSolver<CommandArguments> //El proveedor de argumentos del comando',
		'```',
		'Se pueden realizar modificaciones a las configuraciones comunes en la caché del proceso. No se puede acceder a la Base de Datos con esto',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		if(request.isInteraction)
			return request.reply({ content: '❌ No permitido con comandos Slash.' });

		const message = request.inferAsMessage();

		const deleteAfter = args.hasFlag('del');
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
			await message.reply({ embeds: [ embed ] });
		}
		if(deleteAfter)
			message.delete();
	});

export default command;
