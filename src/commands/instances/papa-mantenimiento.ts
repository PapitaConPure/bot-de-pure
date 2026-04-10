import { getHostName, globalConfigs, remoteStartup } from '@/data/globalProps';
import { Command, CommandTags } from '../commons';

const tags = new CommandTags().add('PAPA');

const command = new Command('papa-mantenimiento', tags)
	.setAliases('papa-maintenance', 'papa-mant', 'papa-maint')
	.setDescription(
		'Hace que la instancia de `<proceso>` que utilizo se restrinja al canal actual',
		'Como lo más probable es que este comando se use mientras estoy hosteada en 2 lugares al mismo tiempo, puedes diferenciar un `<proceso>` de otro por su ubicación de host o con una ID única que equivale a la expresión numérica del momento en el que se ejecutó',
		'Para deshacer la restricción, usa el comando sin argumentos una vez más (en el canal que se estableción la restricción)',
	)
	.setExecution(async (message) => {
		const { channel, user } = message;
		const sent = await channel.send({
			content: [
				`**Host** \`${getHostName()}\``,
				`**Entorno** \`${remoteStartup ? 'PRODUCCIÓN' : 'DESARROLLO'}\``,
				`**ID de InstProc** \`${globalConfigs.startupTime}\``,
				`**Estado** \`[${globalConfigs.maintenance.length ? 'PAUSADO' : 'OPERANDO'}]\``,
			].join('\n'),
		});

		const reactions = globalConfigs.maintenance.length ? ['🌀'] : ['💤', '👁️'];
		Promise.all(reactions.map((reaction) => sent.react(reaction)));
		const filter = (rc, u) => reactions.includes(rc.emoji.name) && user.id === u.id;
		const collector = sent.createReactionCollector({ filter: filter, max: 1, time: 1000 * 30 });
		collector.on('collect', (reaction) => {
			if (globalConfigs.maintenance.length) {
				globalConfigs.maintenance = '';
				sent.react('☑️');
			} else {
				if (reaction.emoji.name === reactions[0]) globalConfigs.maintenance = channel.id;
				else globalConfigs.maintenance = `!${channel.id}`;
				sent.react('✅');
			}
		});
	});

export default command;
