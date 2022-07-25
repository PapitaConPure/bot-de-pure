const { MessageEmbed } = require("discord.js");
const tenshi = { '👉👈': 'https://i.imgur.com/yeYyEvp.jpg' }; //Soy un puto meme
const { CommandMetaFlagsManager } = require('../Commons/commands');

module.exports = {
	name: 'papa-invitar',
    desc: 'Muestra una carta de invitación para agregarme a otro servidor',
	flags: new CommandMetaFlagsManager().add('PAPA'),
	
    /**
     * @param {import('discord.js').Message} param0 
     * @param {Array<String>} _ 
     */
	async execute({ channel, client }, _) {
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.application.id}&scope=bot&permissions=1394522582224`;
        const embed = new MessageEmbed()
            .setTitle('Invitación')
            .setColor('BLURPLE')
            .setImage(tenshi['👉👈'])
            .setFooter({ text: 'Para invitar al bot a algún servidor, __Papita con Puré__ (ID:423129757954211880) debe formar parte del mismo' })
            .addField('¡Invítame a otro servidor!', `Clickea [aquí](${inviteUrl}) y selecciona el servidor al que quieres invitarme (solo __Papita con Puré__)\n`);
        await channel.send({ embeds: [embed] });
    },
};