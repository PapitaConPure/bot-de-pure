const { EmbedBuilder, Message, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const pixivToken = process.env.PIXIV_REFRESH_TOKEN ?? (require('../localenv.json')?.pixivtoken);
const PixivApi = require('pixiv-api-client');
const { shortenText } = require('../func');
const { DiscordAgent } = require('./discordagent.js');
const pixiv = new PixivApi();

const pageSep = '_';
const pixivRegex = /<?((http:\/\/|https:\/\/)(www\.)?)(pixiv.net(\/en)?)\/artworks\/([0-9]{6,9})(_[0-9]+)?>?/g;
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
 * 
 * @param {string} url 
 * @returns {[ Number, Number ]}
 */
function extractIdAndPage(url) {
    const data = url.split('/').pop();

    if(!isNaN(data))
        return [ +data, 0, false ];

    const [ id, page ] = data.split(pageSep);

    return [ +id, +page - 1, true ];
}

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
        const [ postId, pageId, wantsSpecificPage ] = extractIdAndPage(url);
        const baseUrl = url.split(pageSep).shift();
        console.log({ postId, pageId, wantsSpecificPage, url, pageSep, baseUrl });
        const post = (await pixiv.illustDetail(postId).catch(console.error))?.illust;
        if(!post) return;

        const imageRequestOptions = {
            headers: {
                'Referer': 'http://www.pixiv.net',
            },
            responseType: 'arraybuffer',
        };

        /**@type {Array<Buffer>}*/
        const illustBuffers = [];

        /**@type {Array<*> | null}*/
        const metaPages = post.meta_pages;
        if(metaPages?.length && !wantsSpecificPage) {
            for(let j = 0; j < metaPages.length && j < 4; j++) 
                illustBuffers.push(pixiv.requestUrl(metaPages[j].image_urls.large || metaPages[j].image_urls.medium, imageRequestOptions));
        } else {
            const selectedPageNumber = metaPages?.[pageId] ? pageId : 0;
            const selectedPageUrls = metaPages?.[selectedPageNumber]?.image_urls
                || post.image_urls;

            console.log({ postId, pageId, selectedPageNumber, selectedPageUrls });

            illustBuffers.push(pixiv.requestUrl(selectedPageUrls.large || selectedPageUrls.medium, imageRequestOptions));
        }

        /**@type {String}*/
        const profileImageUrl = post.user.profile_image_urls.medium;
        let profileAsset = 'https://s.pximg.net/common/images/no_profile.png';
        if(profileImageUrl !== profileAsset)
            profileAsset = pixiv.requestUrl(profileImageUrl, imageRequestOptions);

        const [ illustImages, profileImage ] = await Promise.all([
            Promise.all(illustBuffers),
            profileAsset,
        ]);

        /**@type {Array<import('discord.js').Attachment>}*/
        const postAttachments = [];
        illustImages.forEach((illustImage, j) => postAttachments.push(new AttachmentBuilder(illustImage, { name: `thumb${i}_p${j}.png` })));
        postAttachments.push(new AttachmentBuilder(profileImage, { name: `pfp${i}.png` }));

        let discordCaption;
        if(post.caption?.length)
            discordCaption = shortenText(
                post.caption
                    .replace(/<\/?strong>/g, '')
                    .replace(/<br ?\/?>/g, '\n')
                    .replace(/<[^>]*>/g, ''),
                256,
                ' (...)',
            ).replace(/<a href=["'](https?:[^"']+)["']( \w+=["'][^"']+["'])*>([^<]+)<\/a>/g, (_substr, url) => {
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
            });
        let postTypeText;
        
        if(metaPages?.length > 1)
            postTypeText = `Galería (${metaPages.length})`;
        else {
            const postType = {
                ugoira: 'Ugoira',
                illust: 'Ilustración',
                manga:  'Manga',
            };
            postTypeText = postType[post.type] ?? 'Imagen';
        }
        
        const postEmbeds = [
            new EmbedBuilder()
                .setColor(0x0096fa)
                .setAuthor({
                    name: post.user.name,
                    url: `https://www.pixiv.net/users/${post.user.id}`,
                    iconURL: `attachment://pfp${i}.png`,
                })
                .setTitle(post.title)
                .setDescription(discordCaption ?? null)
                .setURL(baseUrl)
                .setImage(`attachment://thumb${i}_p0.png`)
                .setFooter({ text: `pixiv • ${postTypeText}`, iconURL: 'https://i.imgur.com/GDJ3mof.png' })
                .setTimestamp(new Date(post.create_date))
                .addFields({
                    name: `💬 ${post.total_comments} ❤ ${post.total_bookmarks} 👁 ${post.total_view}`,
                    value: post.tags.slice(0, 6).map(t => t.translated_name ?? t.name).join(', '),
                })
        ];

        for(let j = 1; j < illustBuffers.length; j++)
            postEmbeds.push(new EmbedBuilder().setURL(baseUrl).setImage(`attachment://thumb${i}_p${j}.png`));

        console.log(postEmbeds);

        return { embeds: postEmbeds, files: postAttachments };
    }))).reduce((a, b) => ({
        embeds: [ ...a.embeds, ...b.embeds ],
        files: [ ...a.files, ...b.files ],
    }));
    
    return messageData;
};

function replacer(match, _p1, _p2, _p3, _p4, _p5, p6) {
    const data = match.split(pageSep);
    const baseUrl = data.shift();
    const pageNumber = data.pop();
    let display = `<:pixivcolor:1138853641600643174> [${p6}`;

    if(pageNumber)
        display += `#${pageNumber}`;

    display += `](${baseUrl})`;

    return display;
}

/**
 * Detecta enlaces de pixiv en un mensaje y los reenvía con un Embed corregido, a través de un Agente Webhook.
 * @param {Message} message El mensaje a analizar
 */
const sendPixivPostsAsWebhook = async (message) => {
    const { content, channel, author } = message;
    if(!message.guild.members.me.permissionsIn(channel).has([ 'ManageWebhooks', 'SendMessages', 'AttachFiles' ]))
        return;

    const pixivUrls = Array.from(content.matchAll(pixivRegex))
        .filter(u => !(u[0].startsWith('<') && u[0].endsWith('>')));

    if(!pixivUrls.length)
        return;
    
    const newMessage = await formatPixivPostsMessage(pixivUrls.map(pixivUrl => pixivUrl[0]));
    message.content = content.replace(pixivRegex, replacer);
    message.files ??= [];
    message.files.push(...newMessage.files);
    message.embeds ??= [];

    console.log('-'.repeat('80'));
    console.log(`${author.tag} ─ ${(new Date()).toLocaleString()}`);
    console.log(`"${content}"`);
    
    message.embeds = message.embeds
        .filter(embed => embed.type === 'rich' || !embed.url.includes('pixiv.net'))
        .map(embed => {
            console.log(embed);
            
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
    formatPixivPostsMessage,
    sendPixivPostsAsWebhook,
};