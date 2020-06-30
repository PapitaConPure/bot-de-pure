const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-decir',
	execute(message, args) {
        message.channel.send({
            files: [message.author.avatarURL()]
        });
    },
};