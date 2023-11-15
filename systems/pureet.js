const { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessagePayload } = require('discord.js');
const { DiscordAgent } = require('./discordagent.js');

const tweetRegex = /<?(https?:\/\/)(www.)?(twitter|x).com\/(\w+)\/status\/(\d+)>?/g;

function replacer(data, _p1, _p2, _p3, _p4, _p5, p6) {
    return `https://vxtwitter.com/${_p4}/status/${_p5}`;
}

/**
 * Detecta enlaces de Tweeter en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message} message El mensaje a analizar
 */
const sendTweetsAsWebhook = async (message) => {
    const { content, channel, author } = message;
    if(!message.guild.members.me.permissionsIn(channel).has([ 'ManageWebhooks', 'SendMessages', 'AttachFiles' ]))
        return;

    const tweetUrls = Array.from(content.matchAll(tweetRegex))
        .filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')));

    if(!tweetUrls.length)
        return;
    
    message.content = content.replace(tweetRegex, replacer);
    message.components = [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`feed_deletePost_${author.id}_NaF`)
            .setEmoji('921751138997514290')
            .setStyle(ButtonStyle.Danger),
    )];

    try {
        const agent = await (new DiscordAgent().setup(channel));
        agent.setUser(author);
        agent.sendAsUser(message);

        if(message.deletable)
            message.delete().catch(console.error);
    } catch(e) {
        console.error(e);
    }
};

module.exports = {
    tweetRegex,
    sendTweetsAsWebhook,
};