const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'orphen',
	aliases: [
        'nightford', 'cuidado'
    ],
    desc: '',
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