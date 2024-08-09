const Discord = require('discord.js');
const { hourai, serverid } = require('../localdata/config.json');

/**
 * @param {Discord.GuildMember|Discord.PartialGuildMember} oldMember
 * @param {Discord.GuildMember} newMember
 */
async function onGuildMemberUpdate(oldMember, newMember) {
    const { guild } = oldMember;
    if(!guild.available) return;

    if( guild.id !== serverid.saki
     || newMember.premiumSinceTimestamp === oldMember.premiumSinceTimestamp
     || newMember.roles.cache.has(hourai.titaniaRoleId)
      ) return;

    return newMember.roles.add(hourai.titaniaRoleId)
    .catch(console.error);
}

module.exports = {
    onGuildMemberUpdate,
};