const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
const imgs = require('../../localdata/drawings.json'); //Imágenes guardadas

module.exports = {
	name: 'todo',
    aliases: [
        'imágenes', 'dibujos',
        'everything', 'images'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send({ content: ':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.' });
            return;
        }
        
        let str = '***LISTA DE IMÁGENES***\n';
        str += 'Mostrando todas las imágenes guardadas del Drawmaku.\n';
        for(let i = 0; i < global.cntimagenes; i++) {
            str += `\`${i + 1}\` **Autor** ${imgs.creador[i]} **Secreto** ${imgs.secreto[i]}\n||${imgs.dibujo[i]}||\n`;
            if(str.length > 1200) {
                message.channel.send({ content: str });
                str = '';
            }
        }

        if(str.length)
            message.channel.send({ content: str });
    },
};