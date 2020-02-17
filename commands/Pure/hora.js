var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'hora',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        const segundos = new Date(Date.now()).getSeconds();
        message.channel.send(`Son las **${segundos / 3600}:${segundos / 60}**.`);
    },
};