//const Discord = require('discord.js'); //Integrar discord.js
//const global = require('../../localdata/config.json'); //Variables globales
const { fetchFlag, fetchUserID } = require('../../func.js');
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
        
        //Detección y procesado de flags
        const someFunc = () => [ 6, 9, 4, 2, 0, 9, 1, 1 ];
        const a = fetchFlag(args, { short: [ 'a', 'x' ], long: [ 'primera', 'alpha', 'bool' ], callback: true, fallback: false });
        const b = fetchFlag(args, { short: [ 'b', 'y' ], long: [ 'segunda', 'beta', 'func' ], callback: someFunc });
        const c = fetchFlag(args, { short: [ 'c', 'z' ], long: [ 'tercera', 'gamma', 'val' ], callback: 42, fallback: 0 });
        const d = fetchFlag(args, {
            property: true,
            short: [ 'd', 'p' ],
            long: [ 'cuarta', 'delta', 'prop', 'usuario' ],
            callback: (x, i) => message.client.users.cache.get(fetchUserID(x[i], message.guild, message.client)).username,
            fallback: () => { message.channel.send({ content: 'Tu vieja.' }); return undefined; }
        });

        console.log({ args, a, b, c, d });
        message.channel.send({ content: `**args** ${args}\n**a** ${a}\n**b** ${b}\n**c** ${c}\n**d** ${d}` });
    },
};