import { Command, CommandOptions, CommandTags } from '../commons';

const options = new CommandOptions()
	.addParam('mensaje', 'TEXT', 'para especificar qué decir')
	.addFlag(['b', 'd'], ['borrar', 'delete'], 'para borrar el mensaje original');
const flags = new CommandTags().add('COMMON', 'EMOTE');
const command = new Command('decir', flags)
	.setAliases('exclamar', 'escribir', 'say', 'echo')
	.setLongDescription('Me hace decir lo que quieras que diga')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const deleteFlag = args.hasFlag('borrar');

		const sentence = args.getString('mensaje', true);

		if(!sentence)
			return request.reply({ content: '⚠️ tienes que especificar lo que quieres que diga.' });

		if (deleteFlag && request.guild.members.me?.permissions.has('ManageMessages'))
			request.delete().catch((_) => _);

		return request.reply({ content: sentence.split(/ +#[Nn] +/g).join('\n') });
	});

export default command;
