const { EmbedBuilder, Message, AttachmentBuilder } = require('discord.js');
const pixivToken = process.env.PIXIV_REFRESH_TOKEN ?? (require('../localenv.json')?.pixivtoken);
const PixivApi = require('pixiv-api-client');
const { shortenText } = require('../func');
const { DiscordAgent } = require('./discordagent.js');
const pixiv = new PixivApi();

const pixivRegex = /<?((http:\/\/|https:\/\/)(www\.)?)(pixiv.net(\/en)?)\/artworks\/([0-9]{6,9})>?/g;
let lastPixivTokenRefresh = 0;

const refreshPixivAccessToken = async () => {
    let authSuccess = false;
    let authAttempts = 0;

    while(!authSuccess && authAttempts < 3) {
        await pixiv.refreshAccessToken(pixivToken)
        .then(() => authSuccess = true)
        .catch(error => {
            console.error(error);
            authAttempts++;
        });
        if(!authSuccess)
            await new Promise(r => setTimeout(r, 3000 * authAttempts));
    }
    lastPixivTokenRefresh = Date.now();

    return authSuccess;
};

/**
 * Analiza las urls ingresadas y devuelve data de mensaje con hasta 4 Embeds de pixiv relacionados
 * @param {Array<String>} urls Enlaces a imágenes de pixiv
 */
const formatPixivPostsMessage = async (urls) => {
    if((Date.now() - lastPixivTokenRefresh) >= 3585e3) {
        const canProceed = await refreshPixivAccessToken();
        if(!canProceed) return;
    }
    
    const messageData = (await Promise.all(urls.slice(0, 4).map(async (url, i) => {
        const postId = url.split('/').pop();
        const post = (await pixiv.illustDetail(postId).catch(console.error))?.illust;
        if(!post) return;

        const imageRequestOptions = {
            headers: {
                'Referer': 'http://www.pixiv.net',
            },
            responseType: 'arraybuffer',
        };
        const illustBuffer = pixiv.requestUrl(post.image_urls.medium, imageRequestOptions);
        const profileImageUrl = post.user.profile_image_urls.medium;
        let profileAsset = 'https://s.pximg.net/common/images/no_profile.png';
        if(profileImageUrl !== profileAsset)
            profileAsset = pixiv.requestUrl(profileImageUrl, imageRequestOptions);

        const [ illustImage, profileImage ] = await Promise.all([illustBuffer, profileAsset]);

        const postAttachments = [
            new AttachmentBuilder(illustImage, { name: `thumb${i}.png` }),
            new AttachmentBuilder(profileImage, { name: `pfp${i}.png` }),
        ];
        let discordCaption;
        if(post.caption?.length)
            discordCaption = shortenText(
                post.caption
                    .replace(/<a href=["'](https?:[^"']+)["']( \w+=["'][^"']+["'])*>([^<]+)<\/a>/g, (_substr, url) => {
                        const labelLink = label => `[🔗 ${label}](${url})`;
                        
                        if(url.includes('twitter.com') | urls.includes('nitter.net'))
                            return labelLink('Twitter');
                        if(url.includes('fanbox.cc'))
                            return labelLink('FANBOX');
                        if(url.includes('fantia.jp'))
                            return labelLink('Fantia');
                        if(url.includes('patreon.com'))
                            return labelLink('Patreon');
                        if(url.includes('skeb.jp'))
                            return labelLink('Skeb');
                        if(url.includes('instagram.com'))
                            return labelLink('Instagram');
                        if(url.includes('pixiv.net'))
                            return labelLink('pixiv');
                        if(url.includes('tumblr.com'))
                            return labelLink('Tumblr');
                        if(url.includes('reddit.com'))
                            return labelLink('Reddit');
      
                        return labelLink('link');
                    })
                    .replace(/<\/?strong>/g, '**')
                    .replace(/<br ?\/?>/g, '\n')
                    .replace(/<[^>]*>/g, ''),
                300,
                ' (...)',
            );
        const postType = {
            ugoira: 'Ugoira',
            illust: 'Ilustración',
            manga:  'Manga',
        };
        
        const postEmbed = new EmbedBuilder()
            .setColor(0x0096fa)
            .setAuthor({
                name: post.user.name,
                url: `https://www.pixiv.net/users/${post.user.id}`,
                iconURL: `attachment://pfp${i}.png`,
            })
            .setTitle(post.title)
            .setDescription(discordCaption ?? null)
            .setURL(url)
            .setImage(`attachment://thumb${i}.png`)
            .setFooter({ text: `pixiv • ${postType[post.type] ?? 'Imagen'}`, iconURL: 'https://i.imgur.com/e4JPSMl.png' })
            .setTimestamp(new Date(post.create_date))
            .addFields({
                name: `💬 ${post.total_comments} ❤ ${post.total_bookmarks} 👁 ${post.total_view}`,
                value: post.tags.slice(0, 6).map(t => t.translated_name ?? t.name).join(', '),
            });

        return { embeds: [ postEmbed ], files: postAttachments };
    }))).reduce((a, b) => ({
        embeds: [ ...a.embeds, ...b.embeds ],
        files: [ ...a.files, ...b.files ],
    }));
    
    return messageData;
};

/**
 * Detecta enlaces de pixiv en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message} message El mensaje a analizar
 */
const sendPixivPostsAsWebhook = async (message) => {
    const { content, channel, author } = message;
    if(!message.guild.members.me.permissions.has('ManageWebhooks'))
        return;

    const pixivUrls = Array.from(content.matchAll(pixivRegex)).filter(u => !u[0].startsWith('<') && !u[0].endsWith('>'));

    if(!pixivUrls.length)
        return;
    
    const newMessage = await formatPixivPostsMessage(pixivUrls.map(pixivUrl => pixivUrl[0]));
    message.content = content.replace(pixivRegex, '<:pixiv:919403803126661120> [$6]($&)');
    message.files ??= [];
    message.files.push(...newMessage.files);
    message.embeds ??= [];
    
    message.embeds = message.embeds
        .filter(embed => !(embed.type !== 'rich' && embed.url.includes('pixiv.net')))
        .map(embed => {
            if(embed.type === 'rich')
                return embed;
            
            if(embed.thumbnail && embed.type === 'image' && !embed.image) {
                embed.image = embed.thumbnail;
                embed.thumbnail = null;
            }
            if(embed.type === 'video') {
                message.files.push(embed.video.url);
                return null;
            }
                
            return embed;
        }).filter(embed => embed);
    message.embeds.push(...newMessage.embeds);

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
    formatPixivPostsMessage,
    sendPixivPostsAsWebhook,
};