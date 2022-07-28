const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { guildEmoji, shortenText } = require('../func');
const { Post, Booru } = require('../systems/boorufetch');
const { getBaseTags, getSearchTags } = require('../localdata/booruprops');
const { fetchFlag } = require('../func');
const globalConfigs = require('../localdata/config.json');
const rakki = require('../commands/Pure/rakkidei');

/**
 * Genera un {@linkcode MessageEmbed} a base de un {@linkcode Post} de {@linkcode Booru}
 * @param {import('discord.js').TextChannel} channel Canal al cual enviar el Embed
 * @param {Post} post Post de Booru
 * @param {{ maxTags: number?, title: string?, footer: string?, cornerIcon: string?, manageableBy: string? }} data Información adicional a mostrar en el Embed. Se puede pasar un feed directamente
 */
function formatBooruPostMessage(post, data = {}) {
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
        } else if(source.includes('skeb.jp')) {
            emoji = '1001397393511682109';
            embedColor = '#28837f';
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
                .setCustomId('feed_shock'),
        );*/
    
    //Botón de eliminación
    row.addComponents(
        new MessageButton()
            .setEmoji('921751138997514290')
            .setStyle('DANGER')
            .setCustomId(`feed_deletePost${ `_${data.manageableBy}` ?? '' }`),
    );

    //Preparar Embed final
    /**@type {import('discord.js').MessageOptions} */
    const feedMessage = { components: [row] };
    const postEmbed = new MessageEmbed()
        .setColor(embedColor)
        .setAuthor({ name: 'Desde Gelbooru', iconURL: data.cornerIcon ?? 'https://i.imgur.com/outZ5Hm.png' });
    const filteredTags = post.tags.slice(0, maxTags);
    const tagsTitle = `${guildEmoji('tagswhite', globalConfigs.slots.slot3)} Tags (${filteredTags.length}/${post.tags.length})`;
    const tagsContent = `*${filteredTags.join(', ').replace(/\*/g,'\\*').replace(/_/g,'\\_')}*`;
    // const tagsContent = filteredTags.join(', ');

    if(maxTags > 0)
        postEmbed.addFields({ name: tagsTitle, value: `_${shortenText(tagsContent, 1020)}_` });
        // postEmbed.addFields({ name: tagsTitle, value: `\`\`\`\n${shortenText(tagsContent, 1000)}\`\`\`` });
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
};

/**
 * @param {import('../commands/Commons/typings').CommandRequest} request
 * @param {import('../commands/Commons/typings').CommandOptions} args
 * @param {Boolean} isSlash
 */
async function searchAndReplyWithPost(request, args, isSlash, options, searchOpt = { cmdtag: '', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
    const isnsfw = request.channel.isThread()
        ? request.channel.parent.nsfw
        : request.channel.nsfw;

    //Bannear lewds de Megumin y Holo >:C
    if(isnsfw) {
        if(searchOpt.cmdtag.length) {
            let abort = true;
            switch(searchOpt.cmdtag) {
            case 'megumin':
                if(request.author.id !== globalConfigs.peopleid.papita)
                    await rakki.execute(request, [], isSlash);
                else abort = false;
                break;
            case 'holo':
                await rakki.execute(request, [], isSlash);
                break;
            default:
                abort = false;
            }
            if(abort) return;
        } else if(['megumin', 'holo'].some(b => args.includes(b)))
            return rakki.execute(request, [], isSlash);
    }

    if(!isSlash)
        await request.channel.sendTyping();
    else
        await request.deferReply();

    const poolSize = options.fetchFlag(args, 'bomba', { callback: f => Math.max(2, Math.min(f, 10)), fallback: 1 });
    const stags = [searchOpt.cmdtag, getBaseTags('gelbooru', isnsfw)].join(' ');
    const words = isSlash
        ? (args.getString('etiquetas') ?? '').split(/ +/)
        : args;
    const extags = getSearchTags(words, 'gelbooru', searchOpt.cmdtag);
    /**@type {import('discord.js').User} */
    const author = (request.author ?? request.user);
    
    //Petición
    try {
        const booru = new Booru(globalConfigs.booruCredentials);
        const response = await booru.search([stags, extags], { limit: 100, random: true });
        //Manejo de respuesta
        if(!response.length) {
            const replyOptions = { content: `:warning: No hay resultados en **Gelbooru** para las tags **"${extags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` };
            return request.editReply?.(replyOptions) ?? request.reply(replyOptions);
        }

        //Seleccionar imágenes
        const posts = response
            .sort(() => 0.5 - Math.random())
            .slice(0, poolSize);

        //Crear presentaciones
        /**@type {Array<MessageEmbed>}*/
        const messages = posts.map(post => formatBooruPostMessage(post, {
            maxTags: 40,
            title: isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle,
            cornerIcon: author.avatarURL({ size: 128, dynamic: true }),
            manageableBy: author.id,
        }));
        if(extags.length)
            messages[posts.length - 1].embeds[0].addFields({ name: 'Tu búsqueda', value: `:mag_right: *${extags.trim().replace('*', '\\*').split(/ +/).join(', ')}*` });

        //Enviar mensajes
        const replyOptions = messages.shift();
        await request.editReply?.(replyOptions) ?? request.reply(replyOptions);
        return Promise.all(messages.map(message => request.channel.send(message))).catch(console.error);
    } catch(error) {
        console.error(error);
        const errorembed = new MessageEmbed()
            .setColor('RED')
            .addFields({
                name: 'Ocurrió un error al realizar una petición',
                value: [
                    'Es probable que le hayan pegado un tiro al que me suministra las imágenes, así que prueba buscar más tarde, a ver si revive 👉👈',
                    '```js',
                    `${[error.name, error.message].join(': ')}\n`,
                    '```',
                ].join('\n'),
            });
        return request.editReply?.({ embeds: [errorembed] }) ?? request.reply({ embeds: [errorembed] });
    }
};

module.exports = {
    formatBooruPostMessage,
    searchAndReplyWithPost,
}