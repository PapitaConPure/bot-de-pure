const { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessagePayload } = require('discord.js');
const { DiscordAgent } = require('./discordagent.js');

const tweetRegex = /<?(https?:\/\/)(www.)?(twitter|x).com\/(\w+)\/status\/(\d+)>?/g;

function replacer(_data, _p1, _p2, _p3, p4, p5, _p6) {
    return `https://$vxtwitter.com/${p4}/status/${p5}`;
}

/**
 * Detecta enlaces de Tweeter en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message} message El mensaje a analizar
 */
const sendTweetsAsWebhook = async (message, configPrefix) => {
    if(configPrefix === '') return;

    const { content, channel, author } = message;
    if(!message.guild.members.me.permissionsIn(channel).has([ 'ManageWebhooks', 'SendMessages', 'AttachFiles' ]))
        return false;

    const tweetUrls = Array.from(content.matchAll(tweetRegex))
        .filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')));

    if(!tweetUrls.length)
        return false;
    
    message.content = content.replace(tweetRegex, replacer);

    try {
        const agent = await (new DiscordAgent().setup(channel));
        agent.setUser(author);
        agent.sendAsUser(message);

        return true;
    } catch(e) {
        console.error(e);
    }

    return false;
};

module.exports = {
    tweetRegex,
    sendTweetsAsWebhook,
};