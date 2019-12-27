let global = require('../../config.json'); //Variables globales
let func = require('../../func.js'); //Funciones globales
let imgs = require('../../images.json'); //Imágenes guardadas
const fs = require('fs'); //Integrar operaciones sistema de archivos de consola

function attachIsImage(msgAttach) {
    let url = msgAttach.url;

    return (url.indexOf("png", url.length - 3) !== -1 || url.indexOf("jpg", url.length - 3) !== -1 || url.indexOf("jpeg", url.length - 4) !== -1);
};

module.exports = {
	name: 'danmaku',
    aliases: [
        'ataque', 'dibujo', 'dibujar', 'spellcard',
        'drawmaku', 'attack', 'draw', 'spell',
        'd'
    ],
	execute(message, args) {
        if(func.notStartedAndSameChannel(message.channel)) return; //Cancelar si no se está en el evento y/o en el mismo canal del evento
        if(global.jugadores[global.ndibujante] !== message.author.id) { //Cancelar comando si no fue ejecutado por el dibujante
            message.channel.send(`:warning: Solo el dibujante, <@${global.jugadores[global.ndibujante]}> (jugador ${global.numeros[global.ndibujante]}), puede seleccionar y dibujar danmaku. Espera tu turno.`);
            return;
        }

        //Adjuntar imagen
        if(!args.length) {
            if(message.attachments.size > 0) {
                if(!message.attachments.every(attachIsImage)) {
                    message.delete(message.author.lastMessageID);
                    message.channel.send(':warning: el archivo adjuntado no es una imagen.');
                    return;
                }
                if(global.dibujado) {
                    message.channel.send(':warning: Ya adjuntaste un dibujo.');
                    return;
                }
                global.dibujado = true;
                imgs.dibujoactual = message.attachments.array()[0].url;
                imgs.dibujo[global.cntimagenes] = message.attachments.array()[0].url;
                imgs.creador[global.cntimagenes] = message.author.name;
                global.cntimagenes++;
                /*fs.writeFile('../../images.json', JSON.stringify(imgs, null, 4), err => {
                    if(err) console.error(err);
                    console.log('Imagen guardada.');
                    console.log(imgs);
                });*/
                if(global.seleccionado) message.channel.send(
                    '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                    '***¡EL DIBUJANTE YA HA SELECCIONADO Y DIBUJADO UN DANMAKU!***\n' +
                    '_¡Voten ahora! ¡No hay necesidad de comandos y tienen infinitos intentos!_\n\n' +
                    `Cuando alguien adivine el danmaku, el dibujante deberá darle puntos con \`${global.p_drmk}recomp <@jugador>\`.\n` +
                    '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
                );
                else message.channel.send(':yin_yang: ~ Se seleccionó un dibujo ~ :yin_yang:');
            } else message.channel.send(`:warning: Olvidaste mencionar tu ataque/spellcard o adjuntar la imagen del danmaku, recuerda: \`${global.p_drmk}danmaku ||<danmaku>||\` o \`${global.p_drmk}danmaku <imagen>\``);
            return;
        }

        //Ingresar ataque
        if(args[0].startsWith('||') && args[args.length - 1].endsWith('||')) {
            message.delete(message.author.lastMessageID);
            if(global.seleccionado) {
                message.channel.send(':warning: Ya seleccionaste un danmaku.');
                return;
            }
            global.danmaku = args[0].slice(2);
            for(var i = 1; i < args.length; i++) global.danmaku += ' ' + args[i];
            global.danmaku = global.danmaku.slice(0, -2);
            global.seleccionado = true;
            if(global.dibujado) message.channel.send(
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                '***¡EL DIBUJANTE YA HA SELECCIONADO Y DIBUJADO UN DANMAKU!***\n' +
                '_¡Voten ahora! ¡No hay necesidad de comandos y tienen infinitos intentos!_\n\n' +
                `Cuando alguien adivine el danmaku, el dibujante deberá darle puntos con \`${global.p_drmk}recomp <@jugador>\`.\n` +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
            );
            else message.channel.send(':yin_yang: ~ Se seleccionó un danmaku ~ :yin_yang:');
        } else {
            message.channel.send(
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬\n' + 
                '***¡WHOOPS!***\n' +
                '_Parece que el dibujante se olvidó de ser más cuidadoso..._\n\n' +
                'El dibujante reveló el origen de su dibujo por accidente. Recuerda usar \\|\\|barras verticales\\|\\| para ocultar tu danmaku.\n' +
                `Si el dibujante actual tiene otro danmaku a mano, puede ingresar \`${global.p_drmk}danmaku ||danmaku||\`, de lo contrario deberá ingresar \`${global.p_drmk}saltar\` y esperar su próximo turno.\n` +
                '▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬'
            );
            global.seleccionado = false;
            global.dibujado = false;
        }
    },
};