//const Discord = require('discord.js'); //Integrar discord.js
//const global = require('../../localdata/config.json'); //Variables globales
const func = require('../../func.js'); //Funciones globales
//const uwu = require('./uwu.js');
//const Canvas = require('canvas'); 

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
    flags: ['papa'],
	
	async execute(message, args) {
        //uwu.execute(message, args);
        //func.dibujarBienvenida(message.member);
        //func.dibujarDespedida(message.member);
        //func.dibujarMillion(message);
        /*const gr = message.channel.guild.roles.cache;
        if(Math.random() < 0.5)
            message.member.roles.add(gr.find(r => r.name === 'Rol con 50% de probabilidades de tenerlo'));*/
        const someFunc = () => [ 6, 9, 4, 2, 0, 9, 1, 1 ];
        const a = func.fetchFlag(args, { short: [ 'f', 's' ], long: [ 'flag', 'short' ], callback: true, fallback: false });
        const b = func.fetchFlag(args, { short: [ 'l', 'o' ], long: [ 'long' ], callback: someFunc });
        const c = func.fetchFlag(args, { short: [ 'h', 'e' ], long: [ 'hentai', 'ecchi' ], callback: 42, fallback: 0 });
        
        console.log({args, a, b, c, asfawefwef });
        message.channel.send(`**args** ${args}\n**a** ${a}\n**b** ${b}\n**c** ${c}`);
    },
};