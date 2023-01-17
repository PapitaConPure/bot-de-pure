const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');

const hd = '682629889702363143'; //Hanged Doll

const flags = new CommandMetaFlagsManager().add(
	'HOURAI',
	'MEME',
);
const command = new CommandManager('suicidio', flags)
	.setAliases(
		'suicidar', 'suicidarse',
		'suicide',
	)
	.setBriefDescription('Te otorga el rol "Hanged Doll"')
	.setLongDescription('Te otorga el rol __Hanged Doll__ en Hourai Doll.')
	.setExecution(async request => {
		const { member } = request;
		if(member.roles.cache.has(hd))
			return request.reply({ content: '\'pérate, cómo weá estai hablando <:junkNo:697321858407727224>' });

		await member.roles.add(hd, 'Por pelotudo');
		return request.reply({ content: '<:houraidoll:853402616208949279> Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai' });
	});

module.exports = command;