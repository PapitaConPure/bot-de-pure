const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const imgs = require('../../localdata/drawings.json'); //Imágenes guardadas

module.exports = {
	name: 'ver',
    aliases: [
        'verdanmaku', 'mostrar', 'mostrardanmaku',
        'see', 'seedanmaku', 'show', 'showdanmaku'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send(':warning: Espera un momento para hacer eso.');
            return;
        }

        message.channel.send(imgs.dibujoactual);
        console.log('Imagen enviada.');
    },
};