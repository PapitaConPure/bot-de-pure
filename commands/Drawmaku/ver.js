var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

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

        fs.readFile('../../images.json', JSON.stringify(imgs, null, 4), err => {
            if(err) console.error(err);
            console.log('Imagen enviada.');
        });
    },
};