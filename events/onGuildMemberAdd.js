const Discord = require('discord.js');
const { dibujarBienvenida } = require('../func.js');
const { guildIsAvailable, announceMemberUpdate } = require('./guildMemberUpdate');

/**@param {Discord.GuildMember} member*/
async function onGuildMemberAdd(member) {
    console.log('Evento de entrada de miembro a servidor desencadenado');
    if(!guildIsAvailable(member.guild)) return;
    if(member.user.id === '239550977638793217') {
        setTimeout(equisde, 1000 * 2, member);
        member.roles.add('1139992433501942001').catch(console.error);
        return member.guild.systemChannel.send('<:kokocrong:1107848001541644389>').catch(console.error);
    }
    announceMemberUpdate(member, dibujarBienvenida);
}

/**@param {Discord.GuildMember} member*/
async function equisde(member) {
    return member.roles.remove('1107831054791876691')
    .catch(error => {
        console.error(error);
        setTimeout(equisde, 1000 * 2, member);
    });
}

module.exports = {
    onGuildMemberAdd,
};