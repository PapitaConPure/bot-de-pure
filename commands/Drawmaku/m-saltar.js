const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'saltar',
    aliases: [
        'saltear',
        'skip',
        's'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) { //Cancelar si el comando no fue ejecutado por un moderador
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.goingnext) { //Cancelar si ya se está cambiando de jugador
            message.channel.send({ content: ':warning: Espera un momento para hacer eso.' });
            return;
        }
        
        //Saltar jugador
        message.delete();
        global.seleccionado = false;
        if(global.dibujado) global.cntimagenes--;
        global.dibujado = false;
        global.recompensado = -1;
        let jumpamt = 1;
        if(args.length) {
            if(args[0] < 1 || args[0] > (global.cntjugadores - 1)) {
                message.channel.send({ content: `:warning: solo puedes saltar entre 1 y ${global.cntjugadores - 1} jugadores.` });
                return;
            }
            jumpamt = args[0];
            let playerslist = '';
            for(let i = 0; i < jumpamt; i++)
                playerslist += `<@${global.jugadores[(global.ndibujante + i) % global.cntjugadores]}> (jugador ${global.numeros[(global.ndibujante + i) % global.cntjugadores]})\n`;
            message.channel.send({ content: `:stop_sign: los siguientes jugadores han sido forzados a dejar de dibujar por esta(s) ronda(s):\n${playerslist}` });
        } else
            message.channel.send({ content: `:stop_sign: <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}) ha sido forzado a dejar de dibujar por esta ronda.` });
        global.goingnext = true;
        setTimeout(func.nextPlayer, 1500, jumpamt);
    },
};