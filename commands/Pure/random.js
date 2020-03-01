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
        //let randchar = '';

        for(let i = 0; i < 11; i++)
            videostr += toString(Math.floor(Math.random() * 256));

        message.channel.send(`https://www.youtube.com/watch?v=${videostr}`);
    },
};