var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'aleatorio',
    aliases: [
        'azar', 'videoaleatorio', 'videorandom',
        'random', 'rand',
        'r'
    ],
	execute(message, args) {
        let videostr = '';
        let randchar = 
            '1234567890' +
            'QWERTYUIOPASDFGHJKLZXCVBNM' +
            'qwertyuiopasdfghjklzxcvbnm' +
            '-_';

        for(let i = 0; i < 11; i++)
            videostr += randchar[Math.floor(Math.random() * 64)];

        message.channel.send(`https://www.youtube.com/watch?v=${videostr}`);
    },
};