const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales
const fs = require('fs');
let path = require('path');
var test = require('../../save.json'); //Variables globales

module.exports = {
	name: 'papa-guardarestado',
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            fs.writeFileSync('https://raw.githubusercontent.com/PapitaConPure/bot-de-pure/master/save.json?token=AH6KN7XKMIMZH6CO5FUPEIC6AYPQM'/*path.join(__dirname, '../../save.json')*/, JSON.stringify(global, null, 4), err => {
                if(err) {
                    message.channel.send(':bangbang: error en la escritura de datos. Se recomienda guardar cualquier dato ingresado al bot en un bloc de notas y reiniciar.');
                    console.error(err);
                    return;
                }
            });
            message.channel.send(`:white_check_mark: datos guardados con éxito.`);
            message.channel.send(`Directorio: \`${__dirname}\``);
            message.channel.send(`\`\`\`json\n${JSON.stringify(test, null, 4)}\`\`\``);
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};