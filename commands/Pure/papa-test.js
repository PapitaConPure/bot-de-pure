const { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js'); //Integrar discord.js
const { CommandMetaFlagsManager } = require('../Commons/commands');
//const global = require('../../localdata/config.json'); //Variables globales
// const { dibujarDespedida } = require('../../func.js');
//const uwu = require('./uwu.js');
//const Canvas = require('canvas'); 

module.exports = {
	name: 'papa-test',
    desc: 'Comando de pruebas :flushed: :point_right: :point_left:',
	flags: new CommandMetaFlagsManager().add('PAPA'),
	
	async execute(request, args) {
        //uwu.execute(message, args);
        //func.dibujarBienvenida(message.member);
        //func.dibujarDespedida(message.member);
        //func.dibujarMillion(message);
        /*const gr = message.channel.guild.roles.cache;
        if(Math.random() < 0.5)
            message.member.roles.add(gr.find(r => r.name === 'Rol con 50% de probabilidades de tenerlo'));*/
        
        //Detección y procesado de flags
        /*const someFunc = () => [ 6, 9, 4, 2, 0, 9, 1, 1 ];
        const a = fetchFlag(args, { short: [ 'a', 'x' ], long: [ 'primera', 'alpha', 'bool' ], callback: true, fallback: false });
        const b = fetchFlag(args, { short: [ 'b', 'y' ], long: [ 'segunda', 'beta', 'func' ], callback: someFunc });
        const c = fetchFlag(args, { short: [ 'c', 'z' ], long: [ 'tercera', 'gamma', 'val' ], callback: 42, fallback: 0 });
        const d = fetchFlag(args, {
            property: true,
            short: [ 'd', 'p' ],
            long: [ 'cuarta', 'delta', 'prop', 'usuario' ],
            callback: (x, i) => message.client.users.cache.get(fetchUserID(x[i], message)).username,
            fallback: () => { message.reply({ content: 'Tu vieja.' }); return undefined; }
        });

        console.log({ args, a, b, c, d });
        message.reply({ content: `**args** ${args}\n**a** ${a}\n**b** ${b}\n**c** ${c}\n**d** ${d}` });*/
        //dibujarDespedida(message.member);
        const embed = new MessageEmbed()
            .setColor('AQUA')
            .addField('Aprendé cómo ser hackeado', 'Presioná el botoncito, dale');
        const row = new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setCustomId('papa-test_test')
                    .setStyle('PRIMARY')
                    .setEmoji('👺')
                    .setLabel('APRETÁ ACÁ'),
            ]);
        return request.reply({ embeds: [embed], components: [row] });
    },

    /**@param {import('discord.js').ButtonInteraction} interaction*/
    async test(interaction) {
        const ipInput = new TextInputComponent()
            .setCustomId('ipInput')
            .setLabel('Pásame tu IP po')
			.setStyle('SHORT');

        const doxInput = new TextInputComponent()
            .setCustomId('doxInput')
            .setLabel('Pásame tu dirección po')
            .setStyle('PARAGRAPH');

        const rows = [
            new MessageActionRow().addComponents(ipInput),
            new MessageActionRow().addComponents(doxInput),
        ];

        const modal = new Modal()
            .setCustomId('papa-test_test2')
            .setTitle('HOLA PERO muy buenas')
            .addComponents(rows);
        interaction.showModal(modal);
    }
};