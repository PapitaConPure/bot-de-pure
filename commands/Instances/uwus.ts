import { EmbedBuilder, Collection, Message, User, ReadonlyCollection, Snowflake } from 'discord.js';
import { paginateRaw } from '../../func';
import { CommandOptions, CommandTags, Command } from '../Commons/';

const options = new CommandOptions()
	.addParam('tiempo', 'NUMBER', 'para establecer la duración del evento, en segundos', { optional: true });

const tags = new CommandTags().add(
	'MEME',
	'GAME',
	'CHAOS',
);

const command = new Command('uwus', tags)
	.setBriefDescription('Inicia un evento UwU en el canal')
	.setLongDescription(
		'Inicia un __evento UwU__, que puede durar el tiempo que se desee hasta 2 horas (7200s).',
		'*Evento UwU:* la persona que más __mensajes que contienen "uwu"s__ envíe para cuando el tiempo acabe, ganará. Ganar no tiene ninún beneficio pero ganar no es perder y perder es feo (umu).',
		'Al finalizar el evento, se muestran los resultados y se borran todos los mensajes con "uwu" enviados durante el mismo.',
	)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const secs = args.getNumber('tiempo', 30);

		const uwuUsers = new Map<Snowflake, number>();
		let lastUwu: User;
		const filter = (m: Message) => !m.author.bot && m.content.toLowerCase().includes('uwu');
		const coll = request.channel.createMessageCollector({ filter: filter, time: (secs * 1000) });

		coll.on('collect', m => {
			const userId = m.author.id;

			if(m.content.toLowerCase().includes('antiuwu'))
				return coll.stop();

			uwuUsers[userId] ??= 0;
			uwuUsers[userId] += 1;
			lastUwu = m.author;
		});

		coll.on('end', async collected => {
			let bestId: Snowflake;
			let max = 0;
			for(const [ uid, count ] of uwuUsers.entries()) {
				if(count >= max) {
					bestId = uid;
					max = count;
				}
			}

			const collectedSlices = paginateRaw(collected as Collection<Snowflake, Message>, 100);

			const embed = new EmbedBuilder()
				.setColor(0xffbbbb)
				.setTitle('Evento UWU finalizado')
				.addFields(
					{
						name: 'Estadísticas',
						value: `**UWUs totales:** ${collected.size}\n**UWUs por segundo:** ${collected.size / secs}`,
						inline: true,
					},
					{
						name: 'Persona que envió...',
						value: `**Más UWUs:** ${bestId ? `<@${bestId}>` : 'nadie umu'}\n**Último UWU:** ${lastUwu ?? 'nadie umu'}`,
						inline: true,
					},
				);

			try {
				return await Promise.all([
					...collectedSlices.map(slice => {
						const sliceCollection = new Collection<Snowflake, Message>(slice);
						return request.channel.bulkDelete(sliceCollection);
					}),
					request.channel.send({ embeds: [ embed ] }),
				]);
			} catch (message) {
				return console.error(message);
			}
		});

		const user = request.user;

		const embed = new EmbedBuilder()
			.setColor(0xffbbbb)
			.setTitle('Evento UWU')
			.addFields(
				{
					name: 'UWU',
					value: 'Envía **uwu** para sumar un **uwu**.',
				},
				{
					name: 'Duración del evento',
					value: `**${secs}** segundos.`,
				},
			)
			.setAuthor({ name: `Evento iniciado por ${user.username}`, iconURL: user.avatarURL({ size: 256 }) });

		return request.reply({ embeds: [ embed ] });
	});

export default command;
