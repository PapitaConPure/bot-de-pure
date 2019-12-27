const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales
const fs = require('fs');
let path = require('path');

module.exports = {
	name: 'papa-guardarestado',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            message.channel.send(`\`\`\`json\n${JSON.stringify(global, null, 4)}\`\`\``);
            fs.writeFile(path.join(__dirname, '../../save.json'), JSON.stringify(global, null, 4), err => {
                if(err) {
                    message.channel.send(':bangbang: error en la escritura de datos. Se recomienda guardar cualquier dato ingresado al bot en un bloc de notas y reiniciar.');
                    console.error(err);
                    return;
                }
            });
            message.channel.send(`:white_check_mark: datos guardados con éxito.`);
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};