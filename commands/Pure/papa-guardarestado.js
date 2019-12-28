const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'papa-guardarestado',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            console.log(JSON.stringify(global, null, 4));
            message.channel.send(
                ':floppy_disk: antes de iniciar el bot, puedes copiar el estado guardado y pegarlo en el archivo \`config.json\` de la carpeta del bot:\n' +
                '_Los datos de estado deberían estar en el log del proceso._'
            );
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};