const { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessagePayload } = require('discord.js');
const { DiscordAgent } = require('./discordagent.js');

const tweetRegex = /<?(https?:\/\/)(www.)?(twitter|x).com\/(\w+)\/status\/(\d+)>?/g;

/**
 * Detecta enlaces de Tweeter en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message<true>} message El mensaje a analizar
 */
const sendTweetsAsWebhook = async (message, configPrefix) => {
    if(configPrefix === '') return;

    const { content, channel } = message;
    if(!message.guild.members.me.permissionsIn(channel).has([ /*'ManageWebhooks', */'SendMessages', 'AttachFiles' ]))
        return false;

    const matches = content.match(tweetRegex);

    if(matches === null)
        return false;

    const tweetUrls = matches.filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')));

    if(!tweetUrls.length)
        return false;
    
    let service;
    if(configPrefix === 'vx')      service = 'fixvx.com';
    else if(configPrefix === 'fx') service = 'fxtwitter.com';

    const convertedUrls = tweetUrls.map(match => match.replace(/(twitter|x).com/, service));
    message.content = convertedUrls.join('\n');

    try {
        //const agent = await (new DiscordAgent().setup(channel));
        //agent.setUser(author);
        //agent.sendAsUser(message, false);
        message.reply({ content: message.content });

        return false;
    } catch(e) {
        console.error(e);
    }

    return false;
};

module.exports = {
    tweetRegex,
    sendTweetsAsWebhook,
};