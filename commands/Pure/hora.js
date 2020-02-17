var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'hora',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        message.channel.send(`Son las **${floor(Date.now() / 1000 / 60 / 60)}:${floor(Date.now() / 1000 / 60)}**.`);
    },
};