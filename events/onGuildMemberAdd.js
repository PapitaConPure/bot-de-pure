const Discord = require('discord.js');
const { dibujarBienvenida } = require('../func.js');
const { guildIsAvailable, announceMemberUpdate } = require('./guildMemberUpdate');

/**@param {Discord.GuildMember} member*/
async function onGuildMemberAdd(member) {
    console.log('Evento de entrada de miembro a servidor desencadenado');
    if(!guildIsAvailable(member.guild)) return;
    announceMemberUpdate(member, dibujarBienvenida);
}

module.exports = {
    onGuildMemberAdd,
};