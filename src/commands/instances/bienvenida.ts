import { Command, CommandOptions, CommandTags } from '../commons';
import { CommandPermissions } from '../commons/cmdPerms';

const perms = new CommandPermissions('ManageGuild');

const options = new CommandOptions().addFlag(
	'c',
	'canal',
	'para especificar el canal al cuál enviar la bienvenida',
	{ name: 'cn', type: 'CHANNEL' },
);

const flags = new CommandTags().add('MOD', 'MAINTENANCE');

const command = new Command(
	{
		es: 'bienvenida',
		en: 'welcome',
		ja: 'welcome',
	},
	flags,
)
	.setBriefDescription('Configura una bienvenida para este servidor')
	.setLongDescription(
		'Edita el mensaje de bienvenida para este servidor.',
		'Las bienvenidas se envían en el canal de mensajes de sistema o en el `--canal` que especifiques',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request) => {
		request.reply({ content: 'a' });
	});

export default command;
