const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { hourai } = require('../../localdata/config.json');

const hd = hourai.hangedRoleId; //Hanged Doll

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
	.setLongDescription('Te otorga el rol __Hanged Doll__ en Saki Scans.')
	.setExecution(async request => {
		const { member } = request;
		if(member.roles.cache.has(hd))
			return request.reply({ content: '\'pérate, cómo weá estai hablando <:junkNo:1107847991580164106>' });

		await member.roles.add(hd, 'Por pelotudo');
		return request.reply({ content: 'Shanghai Shanghai Shanghai Shanghai\nHourai Hourai Hourai Hourai' });
	});

module.exports = command;