const global = require('../../config.json'); //Variables globales
const decir = require('./decir.js');

module.exports = {
	name: 'papa-decir',
    desc: 'Me hace decir lo que quieras que diga (permite que me diga comandos a mí misma)',
    flags: [
        'papa'
    ],
    options: [
        '`<mensaje>` _(texto)_ para borrar tu mensaje',
        '`-d` o `--delete` para borrar tu mensaje'
    ],
    callx: '<mensaje>',
	
	execute(message, args) {
        decir.execute(message, args);
        global.cansay = 2;
    },
};