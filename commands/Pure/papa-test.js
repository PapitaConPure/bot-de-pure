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
            
            while(superLimit >= 1) {
                const options = { limit: Math.min(100, superLimit) };
                if(lid) options.before = lid;
                
                const m = await channel.messages.fetch(options);
                messages.push(...m.array());
                superLimit -= m.size;
                lid = m.last().id;
                
                if(m.size !== 100) break;
            }

            return messages;
        }
        message.channel.messages.fetch
        let total = 0;
        const m = await message.channel.send('_Buscando mensajes, esto puede tardar un buen rato..._');
        await Promise.all(
            message.client.guilds.cache
            .filter(ch => !['voice', 'store', 'unknown', 'category'].includes(ch.type))
            .find(g => g.id === message.channel.guild.id)
            .channels.cache.map(async ch => {
                const msgs = await superFetch(ch, 1000);
                m.edit(`_Buscando mensajes, esto puede tardar un buen rato..._\n**Último canal** ${ch.name}`);
                total += msgs.length;
                console.log([ch.name, total]);
            })
        );
        m.edit(`_Búsqueda de mensajes concluída_\n**Total** ${total}`);
    },
};