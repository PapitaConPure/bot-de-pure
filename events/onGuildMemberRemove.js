const Discord = require('discord.js');
const { dibujarDespedida } = require('../func.js');
const { guildIsAvailable, announceMemberUpdate } = require('./guildMemberUpdate');

/**@param {Discord.GuildMember} member*/
async function onGuildMemberRemove(member) {
    console.log('Evento de salida de miembro de servidor desencadenado');
    if(!guildIsAvailable(member.guild)) return;
    if(member.user.id === '239550977638793217')
        return member.guild.systemChannel.send('Se fue el bigote');
    announceMemberUpdate(member, dibujarDespedida);
}

module.exports = {
    onGuildMemberRemove,
};