const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { guildEmoji, shortenText } = require('../func');
const { Post, Booru } = require('../systems/boorufetch');
const globalConfigs = require('../localdata/config.json')

module.exports = {
    /**
     * @
     * Genera un @link a base de un {@linkcode Post} de {@linkcode Booru}
     * @param {import('discord.js').TextChannel} channel Canal al cual enviar el Embed
     * @param {Post} post Post de Booru
     * @param {{ maxTags: number?, title: string?, footer: string?, cornerIcon: string?, manageableBy: string? }} data Información adicional a mostrar en el Embed. Se puede pasar un feed directamente
     */
    formatBooruPostMessage: function(post, data = {}) {
        const maxTags = data.maxTags ?? 20;
        //Botón de Post de Gelbooru
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setEmoji('919398540172750878')
                .setStyle('LINK')
                .setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`),
        );
        /**@type {import('discord.js').ColorResolvable}*/
        let embedColor = 'AQUA';

        //Botón de Fuente (si está disponible)
        const addSourceButton = (source) => {
            if(!source.match(/(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?/))
                return;
                
            let emoji;
            if(source.includes('pixiv.net')) {
                emoji = '919403803126661120';
                embedColor = '#0096fa';
            } else if(source.match(/twitter\.com|twimg\.com/)) {
                emoji = '919403803114094682';
                embedColor = '#1da1f2';
            } else if(source.includes('fanbox.cc')) {
                emoji = '999783444655648869';
                embedColor = '#faf18a';
            } else if(source.includes('fantia.jp')) {
                emoji = '1000265840182181899';
                embedColor = '#ea4c89';
            } else if(source.includes('tumblr.com')) {
                emoji = '969666470252511232';
                embedColor = '#36465d';
            } else if(source.match(/reddit\.com|i\.redd\.it/)) {
                emoji = '969666029045317762';
                embedColor = '#ff4500';
            } else {
                emoji = '969664712604262400';
                embedColor = '#1bb76e';
            }

            if(source.length > 512)
                return row.addComponents(
                    new MessageButton()
                        .setEmoji(emoji)
                        .setStyle('DANGER')
                        .setCustomId('feed_invalidUrl')
                        .setDisabled(true),
                );

            row.addComponents(
                new MessageButton()
                    .setEmoji(emoji)
                    .setStyle('LINK')
                    .setURL(source),
            );
        };
        const source = post.source;
        if(source) {
            const sources = (typeof source === 'object')
                ? Object.values(source)
                : source.split(/[ \n]+/);
            sources.slice(0, 2).forEach(addSourceButton);
        }
        
        //Botón de tags (si es necesario) o de enlace
        row.addComponents(
            new MessageButton()
                .setEmoji('921788204540100608')
                .setStyle('PRIMARY')
                .setCustomId('feed_showFeedImageTags'),
        );
        
        //Botón de Shock (temporal)
        /*const closeDate = new Date('February 3, 2022 0:00:0 GMT-03:00');
        const now = new Date(Date.now());
        const diff = (closeDate - now) / (1000 * 60 * 60);
        //console.log(closeDate.toLocaleTimeString(), '-', now.toLocaleTimeString(), '=', diff);
        if(now < closeDate)
            row.addComponents(
                new MessageButton()
                    .setLabel(`${((diff > 24) ? (diff / 24) : diff).toLocaleString('en', { maximumFractionDigits: 0 })} ${(diff > 24) ? 'días' : 'horas'}`)
                    .setEmoji('935665140601327626')
                    .setStyle('PRIMARY')
                    .setCustomId('feed_shockFeed'),
            );*/
        
        //Botón de eliminación
        row.addComponents(
            new MessageButton()
                .setEmoji('921751138997514290')
                .setStyle('DANGER')
                .setCustomId(`feed_deleteFeedImage${ `_${data.manageableBy}` ?? '' }`),
        );

        //Preparar Embed final
        /**@type {import('discord.js').MessageOptions} */
        const feedMessage = { components: [row] };
        const postEmbed = new MessageEmbed()
            .setColor(embedColor)
            .setAuthor({ name: 'Desde Gelbooru', iconURL: data.cornerIcon ?? 'https://i.imgur.com/outZ5Hm.png' });
        const filteredTags = post.tags.slice(0, maxTags);
        const tagsTitle = `${guildEmoji('tagswhite', globalConfigs.slots.slot3)} Tags (${filteredTags.length}/${post.tags.length})`;
        // const tagsContent = `*${filteredTags.join(', ').replace(/\\*\*/g,'\\*').replace(/\\*_/g,'\\_')}*`;
        const tagsContent = filteredTags.join(', ');

        if(maxTags > 0)
            postEmbed.addFields({ name: tagsTitle, value: `\`\`\`\n${shortenText(tagsContent, 1000)}\`\`\`` });
        if(data.title)
            postEmbed.setTitle(data.title);
        if(data.footer)
            postEmbed.setFooter({ text: data.footer });
        
        if(post.fileUrl.match(/\.(mp4|webm|webp)/)) {
            postEmbed.addFields({ name: 'Video', value: `[Míralo en tu navegador (<:gelbooru:919398540172750878>)](${post.fileUrl})` });
            postEmbed.setImage(post.sampleUrl || post.previewUrl);
        } else if(post.fileUrl.match(/\.gif/))
            postEmbed.setImage(post.fileUrl);
        else
            postEmbed.setImage(
                post.sampleUrl
                || post.fileUrl
                || post.previewUrl
            );
        
        feedMessage.embeds = [postEmbed];
        
        //Enviar imagen de Feed
        return feedMessage;
    }
}