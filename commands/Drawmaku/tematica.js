const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'tematica',
    aliases: [
        'temática', 'tem', 'recordartematica', 'recordartemática',
        'theme', ''
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel, true)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        
        //Comprobar si el llamador está jugando
        var idjugador = func.getMentionPlayerID(`<@${message.author.id}>`);
        
        //Repetir temática si el llamador está jugando
        if(idjugador !== -1) {
            message.channel.send(
                '*__Repitiendo...__*\n' +
                `La temática es: ***${global.tem}***\n` +
                `> ${global.desctem}\n`
            );
        } else message.channel.send(':warning: tenés que estar dentro del evento para repetir la temática.');
    },
};