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

        message.channel.send(`https://www.youtube.com/watch?v=${videostr}`).then(sent => {
            const filter = rct => rct.emoji.id === '683610811008024609';
            const PogChamp = message.client.emojis.get('683610811008024609');
            sent.react(PogChamp)
                .then(() => {
                    const collector = sent.createReactionCollector(filter, { time: 8 * 60 * 1000 });
                    collector.on('collect', reaction => {
                        videostr = '';
                        for(let i = 0; i < 11; i++)
                            videostr += randchar[Math.floor(Math.random() * 64)];
                        sent.edit(`https://www.youtube.com/watch?v=${videostr}`);
                    });
                });
        });
    },
};