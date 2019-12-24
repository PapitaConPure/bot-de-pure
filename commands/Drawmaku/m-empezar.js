const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'm-empezar',
    aliases: [
        'm-comenzar', 'm-comienzo', 'm-iniciar', 'm-inicio',
        'm-start', 'm-begin',
        'm-st'
    ],
	execute(message, args) {
        //Comprobar que se pueda empezar un nuevo Drawmaku
        if(func.notModerator(message.member)) {
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
        if(global.trest > 0) {
            message.channel.send(':warning: El Drawmaku ya está por empezar.');
            return;
        }
        if(global.empezado) {
            message.channel.send(':warning: El Drawmaku ya ha empezado.');
            return;
        }
        
        //Empezar nuevo Drawmaku
        global.trest = global.tiempo;
        global.chi = message.channel;
        global.cntjugadores = 0;
        global.ndibujante = 0;
        message.channel.send(
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
            '***INSCRIPCIONES ABIERTAS***\n' +
            `_¡Ya pueden comenzar a inscribirse a la ${global.edi}ª edición de Drawmaku!_\n\n` +
            `**Tienen ${global.tiempo} segundos para inscribirse.**\n` +
            `Para entrar al evento escribe \`${global.p_drmk}entrar\` ahora.\n` +
            `Para salir del evento escribe \`${global.p_drmk}salir\` en cualquier momento.\n` +
            '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        );
    },
};