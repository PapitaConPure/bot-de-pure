var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'hora',
    aliases: [
        'comandos', 'acciones',
        'help', 'commands',
        'h'
    ],
	execute(message, args) {
        const horas = new Date.getHours();
        const minutos = new Date.getMinutes();
        const segundos = new Date.getSeconds();
        message.channel.send(`Son las **${horas}:${minutos}:${segundos}**.`);
    },
};