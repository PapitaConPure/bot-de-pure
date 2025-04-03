const global = require('../../localdata/config.json'); //Variables globales
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-mantenimiento', flags)
	.setAliases('papa-maintenance', 'papa-mant', 'papa-maint')
	.setDescription(
		'Hace que la instancia de `<proceso>` que utilizo se restrinja al canal actual',
		'Como lo más probable es que este comando se use mientras estoy hosteada en 2 lugares al mismo tiempo, puedes diferenciar un `<proceso>` de otro por su ubicación de host o con una ID única que equivale a la expresión numérica del momento en el que se ejecutó',
		'Para deshacer la restricción, usa el comando sin argumentos una vez más (en el canal que se estableción la restricción)',
	)
	.setExperimentalExecution(async message => {
		const { channel, user } = message;
		const sent = await channel.send({ content: `**Host** \`${global.bot_status.host}\`\n**ID de InstProc** \`${global.startupTime}\`\n**Estado** \`[${global.maintenance.length?'PAUSADO':'OPERANDO'}]\``})

		const reactions = (global.maintenance.length)?['🌀']:['💤','👁️'];
		Promise.all(reactions.map(reaction => sent.react(reaction)));
		const filter = (rc, u) => reactions.includes(rc.emoji.name) && user.id === u.id;
		const collector = sent.createReactionCollector({ filter: filter, max: 1, time: 1000 * 30 });
		collector.on('collect', reaction => {
			if(global.maintenance.length) {
				global.maintenance = '';
				sent.react('☑️');
			} else {
				if(reaction.emoji.name === reactions[0])
					global.maintenance = channel.id;
				else
					global.maintenance = `!${channel.id}`;
				sent.react('✅');
			}
		});
	});

module.exports = command;
