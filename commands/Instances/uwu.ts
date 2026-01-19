import { randInArray } from '../../func';
import { CommandOptions, CommandTags, Command } from '../Commons/';

const uwusopt = [
	'<:uwu:681935702308552730>',
	'<:uwu2:681936445958914128>',
	'<:uwu3:681937073401233537>',
	'<:uwu4:681937074047549467>',
	'<:uwu5:720506981743460472>'
];

const options = new CommandOptions()
	.addParam('uwu', { name: 'uwu', expression: 'uwu' }, 'uwu', { optional: true })
	.addFlag('u', 'uwuwu', 'uwu')
	.addFlag('bd', [ 'borrar', 'delete' ], 'para borrar el mensaje original');

const tags = new CommandTags().add(
	'MEME',
	'EMOTE',
);

const command = new Command('uwu', tags)
	.setAliases('uwu')
	.setLongDescription('uwu')
	.setOptions(options)
	.setExecution(async (request, args) => {
		const deleteOriginal = args.hasFlag('borrar');
		const randomUwu = randInArray(uwusopt);

		if(deleteOriginal && request.isMessage) {
			return Promise.all([
				request.channel.send({ content: randomUwu }).catch(console.error),
				request.delete().catch(console.error),
			]);
		}

		return request.reply({ content: randomUwu }).catch(console.error);
	});

export default command;
