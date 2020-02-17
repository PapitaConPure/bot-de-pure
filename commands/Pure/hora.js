var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'hora',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        message.channel.send(`Son las **${Math.floor(Date.now() / 1000 / 60 / 60)}:${Math.floor(Date.now() / 1000 / 60)}**.`);
    },
};