const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'juani',
	aliases: [
        'wholesome', 'wani'
    ],
    desc: 'Comando bonito y hermoso de JuaniUru',
    flags: [
        'meme',
        'outdated'
    ],
    options: [

    ],
	
	execute(message, args){
		message.channel.send('**Gwacyas~♪** <:uwu:681935702308552730>');
    },
};