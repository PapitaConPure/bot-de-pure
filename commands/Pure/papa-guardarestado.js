const global = require('../../localdata/config.json'); //Variables globales
const imgs = require('../../localdata/drawings.json'); //Variables globales
const fs = require('fs');

module.exports = {
	name: 'papa-guardarestado',
    desc: 'Vuelca el estado de todas mis propiedades en el momento que se ejecuta el comando y se envía como un archivo de texto para descargar',
    flags: [
        'papa',
        'outdated'
    ],
	
	async execute(message, args) {
        let templog = JSON.stringify(global, null, 4);
        let tempimg = JSON.stringify(imgs, null, 4);
        let tempdata = `localdata/config.json\n${templog}\n\n\nlocaldata/drawings.json\n${tempimg}`;
        tempdata = tempdata.split('\n').join('\r\n');
        fs.writeFile("save.txt", tempdata, err => {
            if(err) console.log(err);
        });
        message.channel.send({
            content: ':floppy_disk: **archivo generado**. Guarda los datos en los archivos del proyecto especificados.\n',
            files: ["save.txt"]
        });
    },
};