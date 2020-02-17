var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'hora',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        const ms = new Date(Date.now());
        const segundos = ms.getSeconds();
        message.channel.send(`Son las **${segundos / 3600}:${segundos / 60}**.`);
    },
};