const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'test',
	execute(message, args) {
		message.channel.send(`\`${message.member.roles.size}\``);
    },
};