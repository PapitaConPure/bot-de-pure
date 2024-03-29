const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../localdata/config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'empezar',
    aliases: [
        'comenzar', 'comienzo', 'iniciar', 'inicio',
        'start', 'begin',
        'st'
    ],
	execute(message, args) {
        //Comprobar que se pueda empezar un nuevo Drawmaku
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        if(global.trest > 0) {
            message.channel.send({ content: ':warning: El Drawmaku ya está por empezar.' });
            return;
        }
        if(global.empezado) {
            message.channel.send({ content: ':warning: El Drawmaku ya ha empezado.' });
            return;
        }
        
        //Empezar nuevo Drawmaku
        global.trest = global.tiempo;
        global.chi = message.channel;
        global.cntjugadores = 0;
        global.ndibujante = 0;
        let notification = '';
        if(global.notroles !== 'na') notification = `:bell: <@&${global.notroles}> :bell:\n`;
        let tiempoinsc = `${global.tiempo} segundos`;
        if(global.tiempo >= 3600) tiempoinsc = `${Math.floor(global.tiempo / 3600)} hora(s)`;
        else if(global.tiempo >= 60) tiempoinsc = `${Math.floor((global.tiempo / 60) % 60)} minuto(s)`;
        message.channel.send({
            content:
                notification +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                '***INSCRIPCIONES ABIERTAS***\n' +
                `_¡Ya pueden comenzar a inscribirse a la ${global.edi}ª edición de Drawmaku!_\n\n` +
                `¡Si quieren empezar sus dibujos ahora: la temática de esta edición será **${global.tem}**!\n` +
                `> ${global.desctem}\n` +
                `**Tienen ${tiempoinsc} para inscribirse.**\n` +
                `Para entrar al evento escribe \`${global.p_drmk}entrar\` ahora.\n` +
                `Para salir del evento escribe \`${global.p_drmk}salir\` en cualquier momento.\n` +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        });
        let listareglas = '';
        for(let i = 0; i < global.reglas.length; i++)
            listareglas += `• **${i + 1}:** ${global.reglas[i]}\n`;
        message.channel.send({
            content: 
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                '***REGLAS***\n' +
                listareglas +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
        });
    },
};