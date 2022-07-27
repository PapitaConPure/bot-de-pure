const { randRange } = require("../../func");
const { auditError } = require("../../systems/auditor");
const { CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const emot = [
	'Mi polola', 'Mi reina', 'Mi princesa', 'Mi esposa', 'Mi mujer',
	':wine_glass:', ':wine_glass::wine_glass:', ':wine_glass::wine_glass::wine_glass:',
	'No avancé en el manga de Komachi', 'Mañana lo hago', 'Otro día', 'Mañana sin falta', 'Esta semana lo termino', 'Procrastinar'
];

const flags = new CommandMetaFlagsManager().add(
	'MEME',
	'OUTDATED',
);
const command = new CommandManager('bern', flags)
	.setAliases('bewny', 'polola', 'procrastinar')
	.setLongDescription('Comando de procrastinación de GoddamnBernkastel')
	.setExecution(async request => {
		const lel = [
			'654504689873977347',
			'722334924845350973',
			'722334924845350973',
			'697323104141049867',
		].map(eid => request.client.emojis.cache.get(eid));
		const selection = randRange(0, emot.length);
		const sent = await request.reply({ content: `**${emot[selection]}** <:bewny:722334924845350973>`, fetchReply: true })
		.catch(error => auditError(error, { request, ping: true }));

		if(selection <= 4)
			return sent.react(lel[0]).catch(auditError);
		if(selection > 4 && selection <= 7)
			return sent.react(lel[1]).catch(auditError);
		return Promise.all([
			sent.react(lel[2]),
			sent.react(lel[3]),
		]).catch(auditError);
	});

module.exports = command;