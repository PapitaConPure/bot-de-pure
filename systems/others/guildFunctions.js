const { saki } = require('../../data/sakiProps');
const serverIds = require('../../data/serverIds.json');

/**@param {import('discord.js').Message} message*/
function getAnnoyedByHourai(message) {
	const { channel, author } = message;
	if(author.id === message.client.user.id) return;
	const content = message.content.toLowerCase();
	const hrai = content.indexOf('hourai');
	const reps = saki.replies;
	const { prefix: hraipf, suffix: hraisf } = reps.ignore;
	const hraifound = hrai !== -1 && !(hraipf.some(pf => content.indexOf(`${pf}hourai`) === (hrai - pf.length)) || hraisf.some(sf => content.indexOf(`hourai${sf}`) === hrai));
	if(hraifound) {
		const fuckustr = (content.indexOf('puré') !== -1 || content.indexOf('pure') !== -1) ? reps.compare : reps.taunt;
		channel.isSendable() && channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)]});
		//message.channel.send({ content: 'Descanse en paz, mi pana <:pensaki:852779998351458344>' });
	} else if(content.startsWith('~echo ') || content.startsWith('$say '))
		setTimeout(() => {
			const fuckustr = reps.reply;
			channel.isSendable() && channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)] });
		}, 800);
};

//Funciones de Respuesta Rápida personalizadas por servidor
module.exports = {
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
