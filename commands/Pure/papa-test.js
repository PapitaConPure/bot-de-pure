//const Discord = require('discord.js'); //Integrar discord.js
const global = require('../../config.json'); //Variables globales
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
        async function superFetch(channel, superLimit = 500) {
            const messages = [];
            let lid;
        
            while(true) {
                const options = { limit: Math.min(100, superLimit - messages.length) };
                if(options.limit < 1) break;
                if(lid) options.before = lid;
        
                const m = await channel.messages.fetch(options);
                messages.push(...m.array());
                lid = m.last().id;
                
                if(m.size !== 100) break;
            }
            console.log([channel.name, messages.length]);

            return messages;
        }
        message.channel.messages.fetch
        let total = 0;
        await Promise.all(
            message.client.guilds.cache.find(g => g.id === message.channel.guild.id)
            .channels.cache.map(async ch => {
                const msgs = await superFetch(ch, 1000 - total);
                total += msgs.length;
                console.log(total);
            })
        );
        message.channel.send(`\`${total}\``);
    },
};