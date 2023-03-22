const Discord = require('discord.js');
const { dibujarDespedida } = require('../func.js');
const { guildIsAvailable, announceMemberUpdate } = require('./guildMemberUpdate');

/**@param {Discord.GuildMember} member*/
async function onGuildMemberRemove(member) {
    console.log('Evento de salida de miembro de servidor desencadenado');
    if(!guildIsAvailable(member.guild)) return;
    announceMemberUpdate(member, dibujarDespedida);
}

module.exports = {
    onGuildMemberRemove,
};