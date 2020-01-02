const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'entrar',
    aliases: [
        'inscribir', 'inscribirse', 'ingresar', 'registrarse',
        'enter', 'inscribe', 'register',
        'e'
    ],
	execute(message, args) {
        if(!global.trest) {
            message.channel.send(':warning: No puedes inscribirte en Drawmaku ahora.');
            return;
        }

        //Comprobar si el jugador está jugando
        var idjugador = func.getMentionPlayerID(`<@${message.author.id}>`);
        
        //Integrar jugador si no está jugando
        if(idjugador === -1) {
            var str = '';
            global.jugadores[global.cntjugadores] = `${message.author.id}`;
            if(args.length > 0) {
                var name = args[0];
                for(var i = 1; i < args.length; i++)
                    name += ' ' + args[i];
                global.nombres[global.cntjugadores] = name;
                str = `(apodo: ${name})`;
            } else global.nombres[global.cntjugadores] = `${message.author.username}`;
            global.numeros[global.cntjugadores] = global.cntjugadores + 1;
            global.puntos[global.cntjugadores] = 0;
            message.channel.send(`:wrestlers: _<@${global.jugadores[global.cntjugadores]}> ha entrado al Drawmaku como el jugador ${global.numeros[global.cntjugadores]} ${str}._`);
            global.cntjugadores++;
            if(global.notroles !== 'na')
                if(!message.member.roles.has(global.notroles)) {
                    let rolget = message.guild.roles.get(global.notroles);
                    if(rolget !== undefined) console.log(`poto\n${message.member}`);
                    else console.log(`not poto\n${message.guild}`);
                    /*wasdmessage.member.addRole(global.notroles)
                    .then(rolegot => console.log(`Añadido nuevo rol a ${message.author.username}`))
                    .catch(err => {
                        console.log('Ha ocurrido un error al asignar un rol.');
                        console.error(err);
                    });*/
                }
        } else message.channel.send(`:warning: No puedes entrar dos veces. Ya estás dentro como el jugador ${global.numeros[idjugador]}.`);
    },
};