const { askCandy } = require('../../func.js'); //Funciones globales

module.exports = {
	name: 'caramelos',
	aliases: [
		'caramelo',
		'candy', 'candies', 'milky'
	],
    desc: 'Otorga caramelos al reaccionar al mensaje generado',
    flags: [
        'hourai',
        'outdated'
    ],
	
	execute(message, args) {
		askCandy(message.member, message.channel);
    },
};