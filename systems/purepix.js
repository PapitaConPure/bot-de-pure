const { MessageEmbed, MessagePayload, Message } = require('discord.js');
const imgurSecret = process.env.IMGUR_SECRET ?? (require('../localenv.json')?.imgursecret);
const imgurToken = process.env.IMGUR_REFRESH_TOKEN ?? (require('../localenv.json')?.imgurrt);
const pixivToken = process.env.PIXIV_REFRESH_TOKEN ?? (require('../localenv.json')?.pixivtoken);
const PixivApi = require('pixiv-api-client');
const { ImgurClient } = require('imgur');
const { DiscordAgent } = require('./discordagent.js');
const pixiv = new PixivApi();
const imgur = new ImgurClient({
    clientId: 'f4b441972b26281',
    clientSecret: imgurSecret,
    refreshToken: imgurToken,
});

const pixivRegex = /<?((http:\/\/|https:\/\/)(www\.)?)(pixiv.net(\/en)?)\/artworks\/([0-9]{6,9})>?/g;

/**
 * @param {String} urls
 * @returns {import('discord.js').MessageOptions | MessagePayload}
 */
const formatPixivPostsMessage = async (urls) => {
    let canProceed = false;
    let authAttempts = 0;

    while(!canProceed && authAttempts < 3) {
        await pixiv.refreshAccessToken(pixivToken)
        .then(() => canProceed = true)
        .catch(error => {
            console.error(error);
            authAttempts++;
        });
        if(!canProceed)
            await new Promise(r => setTimeout(r, 3000 * authAttempts));
    }

    if(!canProceed) return;
    
    const embeds = [];

    await Promise.all(urls.slice(0, 4).map(async url => {
        const postId = url.split('/').pop();
        const post = (await pixiv.illustDetail(postId).catch(console.error)).illust;
        const imageBuffer = await pixiv.requestUrl(post.image_urls.medium, { headers: { 'Referer': 'http://www.pixiv.net' }, responseType: 'arraybuffer' });
        const imgurResponse = await imgur.upload({ image: imageBuffer });
        const postEmbed = new MessageEmbed()
            .setColor('#0096fa')
            .setDescription(post.type === 'ugoira' ? 'Ilustración animada (ugoira)' : 'Ilustración')
            .setAuthor({
                name: post.user.name,
                url: post.user.url,
            })
            .setTitle(post.title)
            .setFooter({
                text: `pixiv • ${postId}`,
                iconURL: 'https://i.imgur.com/e4JPSMl.png',
            })
            .setTimestamp(new Date(post.create_date))
            .addFields({
                name: `💬 ${post.total_comments} ❤ ${post.total_bookmarks} 👁 ${post.total_view}`,
                value: post.tags.slice(0, 6).map(t => t.translated_name ?? t.name).join(', '),
            });
        
        if(imgurResponse?.data?.link)
            postEmbed.setImage(imgurResponse.data.link);

        // setTimeout((deleteHash = imgurResponse.data.deletehash) => imgur.deleteImage(deleteHash), 1000 * 10);

        embeds.push(postEmbed);
    }));
    
    return { embeds };
};

/**
 * 
 * @param {Message} message 
 */
const sendPixivPostsAsWebhook = async (message) => {
    const { content, channel, author } = message;

    const pixivUrls = Array.from(content.matchAll(pixivRegex));

    if(pixivUrls.length) {
        const newMessage = await formatPixivPostsMessage(pixivUrls.map(pixivUrl => pixivUrl[0]));
        newMessage.content = content.replace(pixivRegex, '<:pixiv:919403803126661120> [$6]($&)');
        newMessage.files = [...(message.attachments?.values?.() || [])].map(attachment => attachment.url || attachment.proxyURL);

        try {
            const agent = await (new DiscordAgent().setup(channel));
            agent.setUser(author);
            agent.sendAsUser(newMessage);

            if(message.deletable)
                message.delete().catch(console.error);
        } catch(e) {
            console.error(e);
        }
    }
}

module.exports = {
    formatPixivPostsMessage,
    sendPixivPostsAsWebhook,
};