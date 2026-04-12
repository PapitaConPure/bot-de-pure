import { EmbedBuilder } from 'discord.js';
import { reportFormUrl, tenshiColor } from '@/data/globalProps';
import { Command, CommandTags } from '../commons';

const tags = new CommandTags().add('COMMON');

const command = new Command('sugerir', tags)
	.setAliases('reportar', 'informar')
	.setDescription('Para sugerir mejoras sobre Bot de Puré, o reportar un error')
	.setExecution(async (request) => {
		const embed = new EmbedBuilder()
			.setColor(tenshiColor)
			.setAuthor({
				name: 'Bot de Puré • Comentarios',
				iconURL: request.client.user.displayAvatarURL({ size: 256, extension: 'jpg' }),
			})
			.setThumbnail('https://i.imgur.com/Ah7G6iV.jpg')
			.addFields(
				{
					name: 'Método',
					value: `Para enviar tus comentarios, accede a este [🔗 Formulario de Google](${reportFormUrl})`,
					inline: true,
				},
				{
					name: 'Por favor',
					value: 'Se pide no enviar formularios de broma. Ya para las bromas estoy yo',
					inline: true,
				},
				{
					name: 'Privacidad',
					value: 'Si lo deseas, puedes enviar tus comentarios de forma totalmente anónima',
					inline: true,
				},
			);

		return request.reply({ embeds: [embed] });
	});

export default command;
