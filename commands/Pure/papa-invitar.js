const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'papa-invitar',
    desc: '',
    flags: [
        'papa'
    ],
    options: [

    ],
	
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            message.channel.send(
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' +
                '***ENLACE DE INVITACIÓN DEL BOT***\n' +
                '*Para invitar al bot a algún servidor, __Papita con Puré__ (<@423129757954211880>) debe formar parte del mismo*\n\n' +
                'Clickea este enlace y selecciona el servidor al que quieres invitar al bot (solo __Papita con Puré__):\n' +
                'https://discord.com/oauth2/authorize?client_id=651250669390528561&scope=bot\n' +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n'
            );
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};