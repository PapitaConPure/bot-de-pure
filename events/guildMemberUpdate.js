const Discord = require('discord.js');
const globalConfigs = require('../data/config.json');
const { channelIsBlocked } = require('../func');

/**@type {Map<'dibujarBienvenida'|'dibujarDespedida', (member: Discord.GuildMember | Discord.PartialGuildMember) => String>}*/
const guildBotUpdateText = new Map();
guildBotUpdateText
    .set('dibujarBienvenida', member => `Se acaba de unir un bot.\n***${member} Beep boop, boop beep?***`)
    .set('dibujarDespedida',  member => `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[`);

/**
 * @param {Discord.Guild} guild 
 */
function guildIsAvailable(guild) {
    if(!guild.available || !guild.systemChannelId) return false;
    const systemChannel = guild.channels.cache.get(guild.systemChannelId);
    return systemChannel && systemChannel.isTextBased() && !channelIsBlocked(systemChannel);
}

/**
 * @param {Error} error 
 * @param {Discord.Guild} guild 
 * @param {Discord.User} user 
 * @param {string} [errorMessage]
 */
function handleError(error, guild, user, errorMessage) {
    errorMessage && console.log(errorMessage);
    console.error(error);
    const errorEmbed = new Discord.EmbedBuilder()
        .setColor(0x0000ff)
        .setAuthor({ name: guild.name })
        .setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
        .addFields({ name: errorMessage || 'Error', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
    globalConfigs.logch.send({
        content: `<@${globalConfigs.peopleid.papita}>`,
        embeds: [errorEmbed],
    });
}

/**
 * @param {Discord.GuildMember|Discord.PartialGuildMember} member 
 * @param {Function} fn 
 */
function announceMemberUpdate(member, fn) {
    const { user, guild } = member;
    try {
        if(!user.bot)
            return fn(member);

        return guild.systemChannel.send({
            content: guildBotUpdateText.get(/**@type {'dibujarBienvenida'|'dibujarDespedida'}*/(fn.name))(member),
        }).catch(console.error);
    } catch(error) {
        handleError(error, guild, user);
    }
}

module.exports = {
    guildIsAvailable,
    announceMemberUpdate,
};