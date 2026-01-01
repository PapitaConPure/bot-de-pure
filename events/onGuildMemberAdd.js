const { dibujarBienvenida } = require('../func');
const { guildIsAvailable, announceMemberUpdate } = require('./guildMemberUpdate');

const Logger = require('../utils/logs.js');
const { debug } = Logger('DEBUG', 'GMemberAdd');

/**@param {import('discord.js').GuildMember} member*/
async function onGuildMemberAdd(member) {
    debug(`Evento disparado - ${member.user.username} → ${member.guild.name} (${member.guild.id})`);
    if(!guildIsAvailable(member.guild)) return;
    if(member.user.id === '239550977638793217') {
        setTimeout(equisde, 1000 * 2, member);
        member.roles.add('1139992433501942001').catch(console.error);
        return member.guild.systemChannel.send('<:kokocrong:1107848001541644389>').catch(console.error);
    }
    announceMemberUpdate(member, dibujarBienvenida);
}

/**@param {import('discord.js').GuildMember} member*/
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
