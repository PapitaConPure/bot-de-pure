const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales
var func = require('../../func.js'); //Funciones globales
let imgs = require('../../images.json'); //Imágenes guardadas

module.exports = {
	name: 'm-todo',
    aliases: [
        'm-imágenes',
        'm-everything', 'm-images'
    ],
	execute(message, args) {
        if(func.notModerator(message.member)) {
            message.channel.send(':closed_lock_with_key: Solo aquellos con un rol de moderación de Drawmaku pueden usar este comando.');
            return;
        }
        let i = 0;
        imgs.forEach(image => {
            if(i !== 0) {
                message.channel.send(image.dibujo);
            }
            i++;
        });
    },
};