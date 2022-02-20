const { MessageEmbed } = require("discord.js");

const invitelink = (process.env.INVITE_URL) ? process.env.INVITE_URL : require('../../localenv.json').inviteurl;
const tenshi = { '👉👈': 'https://i.imgur.com/yeYyEvp.jpg' }; //Soy un puto meme
const embed = new MessageEmbed()
    .setTitle('Invitación')
    .setColor('BLURPLE')
    .setImage(tenshi['👉👈'])
    .setFooter({ text: 'Para invitar al bot a algún servidor, __Papita con Puré__ (ID:423129757954211880) debe formar parte del mismo' })
    .addField('¡Invítame a otro servidor!', `Clickea [aquí](${invitelink}) y selecciona el servidor al que quieres invitarme (solo __Papita con Puré__)\n`);

module.exports = {
	name: 'papa-invitar',
    desc: 'Muestra una carta de invitación para agregarme a otro servidor',
    flags: [
        'papa'
    ],
	
	async execute({ channel }, _) {
        await channel.send({ embeds: [embed] });
    },
};