const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papita',
	aliases: [
        'papa', 'leche',
		'potato', 'milk'
    ],
	execute(message, args){
		if(args.length) {
			let newmsg;
			newmsg = `***:copyright: ${args[0]}:registered:`;
			for(let i = 1; i < args.length; i++)
				newmsg += ` ${args[i]}:tm:`;
			newmsg += `***`;
			message.channel.send(newmsg);
		} else {
			if(message.channel.nsfw) message.channel.send('https://www.youtube.com/watch?v=pwEvEY-7p9o');
			else {
				const paputa = [
					'Lechita:tm: uwu :milk:',
					'Romper al bot <:lewdsen:660217470635737088>',
					'¿Qué es "Manzanas contra Bananas"? <:mayuwu:654489124413374474>',
					'J-j-jueguen Palactis <:kogablush:654504689873977347>',
					'Meguuuu <:aliceHug:684625280991756312>',
					'Sagume <:aliceHug:684625280991756312>',
					'***KONOSUBA!***',
					'***NEKOPARA!***'
				];

				message.channel.send(`**${paputa[Math.floor(Math.random() * paputa.length)]}**`).then(sent => {
					sent.react(lel[0])
						.then(() => sent.react(lel[1]));
				});
			}
		}
    },
};