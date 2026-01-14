import { Message } from 'discord.js';
import { saki } from '../../data/sakiProps';
import serverIds from '../../data/serverIds.json';

function getAnnoyedByHourai(message: Message) {
	const { channel, author } = message;

	if(author.id === message.client.user.id) return;
	const content = message.content.toLowerCase();
	const hourai = content.indexOf('hourai');
	const reps = saki.replies;
	const { prefix: hraipf, suffix: hraisf } = reps.ignore;
	const houraiFound = hourai !== -1 && !(hraipf.some(pf => content.indexOf(`${pf}hourai`) === (hourai - pf.length)) || hraisf.some(sf => content.indexOf(`hourai${sf}`) === hourai));

	if(houraiFound) {
		const fuckustr = (content.indexOf('puré') !== -1 || content.indexOf('pure') !== -1) ? reps.compare : reps.taunt;
		channel.isSendable() && channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)]});
	} else if(content.startsWith('~echo ') || content.startsWith('$say ')) {
		setTimeout(() => {
			const fuckustr = reps.reply;
			channel.isSendable() && channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)] });
		}, 800);
	}
};

//Funciones de Respuesta Rápida personalizadas por servidor
export default {
	[serverIds.saki]: {
		getAnnoyedByHourai,
	},

	[serverIds.nlp]: {
		getAnnoyedByHourai,
	},

	[serverIds.slot1]: {
		getAnnoyedByHourai,
	},
}
