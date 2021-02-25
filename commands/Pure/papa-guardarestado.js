const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var imgs = require('../../images.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales
const fs = require('fs');

module.exports = {
	name: 'papa-guardarestado',
    desc: '',
    flags: [
        'papa'
    ],
	
	execute(message, args) {
        if(message.author.id === '423129757954211880') {
            let templog = JSON.stringify(global, null, 4);
            let tempimg = JSON.stringify(imgs, null, 4);
            let tempdata = `CONFIG.JSON\n${templog}\n\n\nIMAGES.JSON\n${tempimg}`;
            tempdata = tempdata.split('\n').join('\r\n');
            fs.writeFile("save.txt", tempdata, err => {
                if(err) console.log(err);
            });
            message.channel.send(
                ':floppy_disk: **archivo generado**. Guarda los datos en los archivos del proyecto especificados.\n',
                { files: ["save.txt"] }
            );
        } else {
            message.channel.send(':closed_lock_with_key: Solo Papita con Puré puede usar este comando.');
            return;
        }
    },
};