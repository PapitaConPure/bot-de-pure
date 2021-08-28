const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales

module.exports = {
	name: 'papa-invitar',
    desc: 'Muestra una carta de invitación para agregarme a otro servidor',
    flags: [
        'papa'
    ],
    options: [

    ],
	
	execute(message, args) {
        message.channel.send({
            content:
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' +
                '***ENLACE DE INVITACIÓN DEL BOT***\n' +
                '*Para invitar al bot a algún servidor, __Papita con Puré__ (<@423129757954211880>) debe formar parte del mismo*\n\n' +
                'Clickea este enlace y selecciona el servidor al que quieres invitar al bot (solo __Papita con Puré__):\n' +
                'https://discord.com/oauth2/authorize?client_id=651250669390528561&scope=bot\n' +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n'
        });
    },
};