import { EmbedBuilder, MessageFlags } from 'discord.js';
import { Translator } from '@/i18n';
import { getWikiPageComponentsV2, searchCommand } from '@/systems/others/wiki.js';
import { p_pure } from '@/utils/prefixes';
import { Command, CommandOptions, CommandTags } from '../commons';

const options = new CommandOptions()
	.addParam('texto', 'TEXT', 'Parámetro de Texto', { optional: true })
	.addParam('número', 'NUMBER', 'Parámetro de Número', { optional: true })
	.addParam('usuario', 'USER', 'Parámetro de Usuario', { optional: true })
	.addParam('miembro', 'MEMBER', 'Parámetro de Miembro', { optional: true })
	.addParam('canal', 'CHANNEL', 'Parámetro de Canal', { optional: true })
	.addParam('mensaje', 'MESSAGE', 'Parámetro de Mensaje', { optional: true })
	.addParam('rol', 'ROLE', 'Parámetro de Rol', { optional: true });

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-test', tags)
	.setLongDescription('Comando de pruebas 😳👉👈')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const translator = new Translator('es');

		const search = args.getString('texto');
		const guildPrefix = p_pure(request.guildId).raw;
		const helpCommand = `${guildPrefix}${command.localizedNames[translator.locale]}`;

		if (!search) return request.reply({ content: 'wah' });

		const foundCommand = await searchCommand(request, search, translator);

		if (!foundCommand) {
			const embed = new EmbedBuilder()
				.setColor(0xe44545)
				.setTitle('Sin resultados')
				.addFields({
					name: 'No se ha encontrado ningún comando que puedas llamar con este nombre',
					value: `Utiliza \`${helpCommand}\` para ver una lista de comandos disponibles y luego usa \`${guildPrefix}ayuda <comando>\` para ver un comando en específico`,
				});

			return request.reply({
				embeds: [embed],
			});
		}

		const components = getWikiPageComponentsV2(foundCommand, request, translator);

		return request.reply({
			flags: MessageFlags.IsComponentsV2,
			components,
		});
	});

export default command;
