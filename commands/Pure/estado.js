const Discord = require('discord.js'); //Integrar discord.js
var global = require('../../config.json'); //Variables globales

module.exports = {
	name: 'estado',
    aliases: [
        'status', 'botstatus'
    ],
	execute(message, args) {
        let clformat = `- ${global.bot_status.changelog[0]}`;
        let tdformat = `- ${global.bot_status.todo[0]}`;
        
        for(let i = 1; i < global.bot_status.changelog.length; i++) clformat += `\n- ${global.bot_status.changelog[i]}`;
        for(let i = 1; i < global.bot_status.todo.length; i++) tdformat += `\n- ${global.bot_status.todo[i]}`;

        const embed = new Discord.MessageEmbed()
            .setColor('#608bf3')
            .setAuthor('Estado del Bot', message.client.user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            .setImage('https://imgur.com/HxTxjdL')
            .addField('Host', global.bot_status.host, true)
            .addField('Versión', `:hash: ${global.bot_status.version.number}\n:scroll: ${global.bot_status.version.name}`)
            .addField('Notas', global.bot_status.note)
            .addField('Cambios', clformat)
            .addField('Lo que sigue', tdformat);

        message.channel.send(embed);
    },
};