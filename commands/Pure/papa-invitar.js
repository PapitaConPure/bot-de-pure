const { EmbedBuilder, Colors } = require("discord.js");
const tenshi = { '👉👈': 'https://i.imgur.com/yeYyEvp.jpg' }; //Soy un puto meme
const { CommandTags, CommandManager } = require('../Commons/commands');

const flags = new CommandTags().add('PAPA');
const command = new CommandManager('papa-invitar', flags)
    .setDescription('Muestra una carta de invitación para agregarme a otro servidor')
    .setExperimentalExecution(async request => {
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${request.client.application.id}&scope=bot&permissions=1394522582224`;
        const embed = new EmbedBuilder()
            .setTitle('Invitación')
            .setColor(Colors.Blurple)
            .setImage(tenshi['👉👈'])
            .setFooter({ text: 'Para invitar al bot a algún servidor, __Papita con Puré__ (ID:423129757954211880) debe formar parte del mismo' })
            .addFields({
                name: '¡Invítame a otro servidor!',
                value: `Clickea [aquí](${inviteUrl}) y selecciona el servidor al que quieres invitarme (solo __Papita con Puré__)`,
            });
        return request.reply({ embeds: [embed] });
    });

module.exports = command;
