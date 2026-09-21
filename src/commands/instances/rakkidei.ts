import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { randRange } from '@/utils/random';
import { Command, CommandTags } from '../commons';

const phrases = [
	'Ahora sí vení que te saco la cresta',
	'Ah mira que bacán. Vení que te rajo',
	'Te voy a pegar el meo pape',
	"Avíspate po'",
	'Te tiraste',
	'Te rifaste',
];
const tenshiurl = 'https://i.imgur.com/eMyvXiC.png';

const flags = new CommandTags().add('COMMON');
const command = new Command('rakkidei', flags)
	.setAliases('rakki', 'tenshi')
	.setDescription('Comando de trompada de Rakkidei')
	.addWikiRow(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitter.com/rakkidei')
			.setEmoji(getBotEmojiResolvable('pixivColor')),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://www.pixiv.net/users/58442175')
			.setEmoji(getBotEmojiResolvable('twitterColor')),
	)
	.setExecution(async (request) =>
		request.reply({
			content: phrases[randRange(0, phrases.length)],
			files: [tenshiurl],
		}),
	);

export default command;
