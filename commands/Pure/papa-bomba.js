const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales

async function deleteChannels(server) {
	await server.channels.cache.filter(ch => ch.type === 'voice').deleteAll();
	server.channels.cache.filter(ch => ch.calculatedPosition !== 0).deleteAll();
}

async function stupidBomb(animLen, animPos, mid, mch) {
	if(animPos === 0) {
		let animStr = ':firecracker: ';
		for(let i = 0; i < animLen; i++) animStr += ':part_alternation_mark: ';
		mch.send(animStr).then(sent => mid = sent.id);
	} else
		mch.fetchMessage(mid).then(msg => {
			if(animPos === 1) {
				let animStr = ':firecracker: ';
				for(let i = 0; i < animLen; i++) animStr += ':part_alternation_mark: ';
				animStr += ':candle:';
				msg.edit(animStr);
			} else if(animPos >= 2 && animPos <= (animLen + 2)) {
				let animStr = ':firecracker: ';
				for(let i = 0; i < (animLen - (animPos - 1)); i++) animStr += ':part_alternation_mark: ';
				animStr += ':fire:';
				msg.edit(animStr);
			}
			else if(animPos === (animLen + 2)) msg.edit(':yellow_square:');
			else if(animPos === (animLen + 3)) msg.edit(':yellow_circle:');
			else if(animPos === (animLen + 4)) msg.edit(':small_orange_diamond:');
			else if(animPos === (animLen + 5)) msg.edit(':high_brightness:');
			else if(animPos === (animLen + 6)) msg.edit(':low_brightness:');
			else if(animPos === (animLen + 7)) msg.edit(':eight_pointed_black_star:');
		});
	
	if(animPos < (8 + animLen)) setTimeout(stupidBomb, 1000, animLen, animPos + 1, mid, mch);
}

module.exports = {
	name: 'papa-bomba',
    desc: 'Comando para reiniciarme',
    flags: [
        'papa',
		'maintenance'
    ],
    options: [
		'`<largo?>` _(número)_ especifica el largo de la mecha (cantidad de segundos antes de que me reinicie)'
    ],
	callx: '<largo?>',
	
	async execute(message, args) {
        /*if(message.author.id === '423129757954211880') {
			if(args.length) stupidBomb(parseInt(args[0]), 0, message.id, message.channel);
			else {
				const sv = message.channel.guild;
				sv.channels.cache.filter(ch => ch.calculatedPosition === 0).tap(ch => {
					if(ch.type === 'text') {
						ch.bulkDelete(100, true);
						ch.send('*Todo lo que comienza, eventualmente termina. Sea por la razón que sea.*');
					}
				});
				
				deleteChannels(sv);
			}
        } else {
			let bomblen = 4;
			if(args.length) bomblen = parseInt(args[0]);
            stupidBomb(bomblen, 0, message.id, message.channel);
        }*/
    },
};