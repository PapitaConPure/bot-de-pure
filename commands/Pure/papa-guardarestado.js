const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'papa-guardarestado',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            //let str = JSON.stringify(global, null, 4).split(/\n+/);
            message.channel.send(
                ':floppy_disk: antes de reiniciar el bot, copiá y pegá esto en el archivo \`config.json\` de la carpeta del bot:\n'/* +
                `\`\`\`json\n${str[i]}\n\`\`\``*/
            );

            message.channel.send({
                files: ['../../config.json']
            });
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};