const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'orphen',
	aliases: [
        'nightford', 'cuidado'
    ],
    desc: 'Comando de grito a Orphen Nightford',
    flags: [
        'meme'
    ],
    options: [

    ],
	
	execute(message, args){
		message.channel.send('***ORPHEN CUIDADO***');
		message.channel.send('***CUIDADO ORPHEEEEEN***');
    },
};