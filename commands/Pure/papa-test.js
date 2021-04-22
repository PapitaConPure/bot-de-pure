//const Discord = require('discord.js'); //Integrar discord.js
//const global = require('../../config.json'); //Variables globales
//const func = require('../../func.js'); //Funciones globales
//const uwu = require('./uwu.js');
//const Canvas = require('canvas'); 

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
    flags: ['papa'],
	
	async execute(message, args) {
        //uwu.execute(message, args);
        //func.dibujarBienvenida(message.member);
        const gr = message.channel.guild.roles.cache;
        if(Math.random() < 0.5)
            message.member.roles.add(gr.find(r => r.name === 'Rol con 50% de probabilidades de tenerlo'));
    },
};