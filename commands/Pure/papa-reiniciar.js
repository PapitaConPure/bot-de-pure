const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales
const token = 'NjUxMjUwNjY5MzkwNTI4NTYx.XeXWSg.SFwfEZuCVNIVz8BS-AqFsntG6KY'; //La llave del bot

module.exports = {
	name: 'papa-guardarestado',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            message.channel.send(':arrows_counterclockwise: reiniciando...')
            .then(sent => {
                console.log('Apagando.');
                client.destroy();
                console.log('Apagado.');
                client.login(token);
                console.log('Encendido.');
                message.channel.send(':white_check_mark: reiniciado.')
            }).catch(error => {
                console.error(error);
            });
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};