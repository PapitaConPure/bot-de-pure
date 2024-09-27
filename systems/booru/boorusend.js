const { makeButtonRowBuilder } = require('../../tsCasts');
// @ts-ignore
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, Message, User, MessageCreateOptions, Snowflake } = require('discord.js');
// @ts-ignore
const { ComplexCommandRequest, CommandArguments } = require('../../commands/Commons/typings');
const { CommandOptions } = require('../../commands/Commons/cmdOpts');
const { guildEmoji: gEmo, shortenText, isThread } = require('../../func');
const { Post, Booru, TagTypes } = require('./boorufetch');
const { getBaseTags, getSearchTags, tagMaps } = require('../../localdata/booruprops');
const globalConfigs = require('../../localdata/config.json');
const rakki = require('../../commands/Pure/rakkidei');
const { Translator } = require('../../internationalization');

/**
 * Genera un {@linkcode EmbedBuilder} a base de un {@linkcode Post} de {@linkcode Booru}
 * @param {Booru} booru
 * @param {Post} post Post de Booru
 * @param {import('./boorufetch').PostFormatData} data Información adicional a mostrar en el Embed. Se puede pasar un feed directamente
 * @returns {Promise<MessageCreateOptions>}
 */
async function formatBooruPostMessage(booru, post, data) {
    data ??= {};
    const maxTags = data.maxTags ?? 20;
    //Botón de Post de Gelbooru
    const row = makeButtonRowBuilder().addComponents(
        new ButtonBuilder()
            .setEmoji('919398540172750878')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`),
    );
    /**@type {import('discord.js').ColorResolvable}*/
    let embedColor = Colors.Aqua;
    let sourceNumber = 0;

    //Botón de Fuente (si está disponible)
    const addSourceButton = (/**@type {String}*/ source) => {
        if(!source) return;

        let emoji;
        
        if(!source.match(/(http:\/\/|https:\/\/)(www\.)?(([a-zA-Z0-9-])+\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?/)) {
            //Si no es un enlace, mostrar el source en texto
            emoji = '969664712604262400';
            return row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`feed_plainText${sourceNumber++}`)
                    .setEmoji(emoji)
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(shortenText(source, 72))
                    .setDisabled(true),
            );
        } else {
            const rawPixivAsset = source.match(/https:\/\/i.pximg.net\/img-original\/img\/[0-9\/]{19}\/([0-9]+)_p[0-9]+\.[A-Za-z]{2,4}/);
            if(rawPixivAsset)
                source = `https://www.pixiv.net/artworks/${rawPixivAsset[1]}`;

            //Dar estilo a Embed según fuente de la imagen
            if(source.includes('pixiv.net')) {
                emoji = '919403803126661120';
                embedColor = 0x0096fa;
            } else if(source.match(/(twitter\.com)|(twimg\.com)|(x\.com)/)) {
                emoji = '1232243415165440040';
                embedColor = 0x040404;
            } else if(source.includes('nitter.net')) {
                emoji = '919403803114094682';
                embedColor = 0xff6c60;
            } else if(source.includes('fanbox.cc')) {
                emoji = '999783444655648869';
                embedColor = 0xfaf18a;
            } else if(source.includes('fantia.jp')) {
                emoji = '1000265840182181899';
                embedColor = 0xea4c89;
            } else if(source.includes('skeb.jp')) {
                emoji = '1001397393511682109';
                embedColor = 0x28837f;
            } else if(source.includes('tumblr.com')) {
                emoji = '969666470252511232';
                embedColor = 0x36465d;
            } else if(source.match(/(reddit\.com)|(i\.redd\.it)/)) {
                emoji = '969666029045317762';
                embedColor = 0xff4500;
            } else {
                emoji = '969664712604262400';
                embedColor = 0x1bb76e;
            }
        }

        if(source.length > 512)
            return row.addComponents(
                new ButtonBuilder()
                    .setEmoji(emoji)
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId('feed_invalidUrl')
                    .setDisabled(true),
            );

        row.addComponents(
            new ButtonBuilder()
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Link)
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
    
    //Botón de tags
    row.addComponents(
        new ButtonBuilder()
            .setEmoji('921788204540100608')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`feed_showFeedImageTags_${data.isNotFeed ? 'NaF' : ''}`),
    );
    
    //Botón de Shock (temporal)
    /*const closeDate = new Date('February 3, 2022 0:00:0 GMT-03:00');
    const now = new Date(Date.now());
    const diff = (closeDate - now) / (1000 * 60 * 60);
    //console.log(closeDate.toLocaleTimeString(), '-', now.toLocaleTimeString(), '=', diff);
    if(now < closeDate)
        row.addComponents(
            new ButtonBuilder()
                .setLabel(`${((diff > 24) ? (diff / 24) : diff).toLocaleString('en', { maximumFractionDigits: 0 })} ${(diff > 24) ? 'días' : 'horas'}`)
                .setEmoji('935665140601327626')
                .setStyle(ButtonStyle.Primary)
                .setCustomId('feed_shock'),
        );*/
    
    //Botón de eliminación
    row.addComponents(
        new ButtonBuilder()
            .setEmoji('921751138997514290')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`feed_deletePost${ `_${data.manageableBy}` ?? '' }_${data.isNotFeed ?? ''}`),
    );

    //Preparar Embed final
    /**@type {MessageCreateOptions} */
    const feedMessage = { components: [row] };
    const postEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: 'Desde Gelbooru', iconURL: data.cornerIcon ?? 'https://i.imgur.com/outZ5Hm.png' });

    //Tags
    const postTags = await booru.fetchPostTags(post);

    const postArtistTags   = postTags
        .filter(t => t.type === TagTypes.ARTIST)
        .map(t => t.name);
    const postCharacterTags = postTags
        .filter(t => t.type === TagTypes.CHARACTER)
        .map(t => t.name);
    const postCopyrightTags = postTags
        .filter(t => t.type === TagTypes.COPYRIGHT)
        .map(t => t.name);

    const otherTypes = /**@type {Array<import('./boorufetch').TagType>}*/([
        TagTypes.ARTIST,
        TagTypes.CHARACTER,
        TagTypes.COPYRIGHT,
    ]);
    const postOtherTags = postTags
        .filter(t => !otherTypes.includes(t.type))
        .map(t => t.name);

    /**
     * @param {Array<String>} tagNames 
     * @param {String} sep 
     */
    const formatTagNameList = (tagNames, sep) => tagNames.join(sep)
        .replace(/\\/g,'\\\\')
        .replace(/\*/g,'\\*')
        .replace(/_/g,'\\_')
        .replace(/\|/g,'\\|');

    const s3 = globalConfigs.slots.slot3;
    const filteredTags = postOtherTags.slice(0, maxTags);
    const tagsTitle = `${gEmo('tagswhite', s3)} Tags (${filteredTags.length}/${post.tags.length})`;
    const tagsContent = formatTagNameList(filteredTags, ' ');

    if(postArtistTags.length > 0) {
        const artistTagsContent = formatTagNameList(postArtistTags.slice(0, 3), '\n');
        if(artistTagsContent.length > 0)
            postEmbed.addFields({ name: `${gEmo('pencilwhite', s3)} Artistas`, value: shortenText(artistTagsContent, 1020), inline: true })
    }
    if(postCharacterTags.length > 0) {
        const characterTagsContent = formatTagNameList(postCharacterTags.slice(0, 3), '\n');
        if(characterTagsContent.length > 0)
            postEmbed.addFields({ name: `${gEmo('personwhite', s3)} Personajes`, value: shortenText(characterTagsContent, 1020), inline: true })
    }
    if(postCopyrightTags.length > 0) {
        const copyrightTagsContent = formatTagNameList(postCopyrightTags.slice(0, 3), '\n');
        if(copyrightTagsContent.length > 0)
            postEmbed.addFields({ name: `${gEmo('questionwhite', s3)} Copyright`, value: shortenText(copyrightTagsContent, 1020), inline: true })
    }
    if(maxTags > 0)
        postEmbed.addFields({ name: tagsTitle, value: `_${shortenText(tagsContent, 1020)}_` });
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
    
    return feedMessage;
};

/**
 * Envía una notificación de {@linkcode Post} de {@linkcode Booru} a todos los {@linkcode User} suscriptos a las tags del mismo
 * @typedef {{ userId: Snowflake, followedTags: Array<String> }} Suscription
 * @param {Post} post
 * @param {Message<true>} sent
 * @param {Array<Suscription>} feedSuscriptions 
 */
async function notifyUsers(post, sent, feedSuscriptions) {
    if(!sent) throw 'Se esperaba un mensaje para el cuál notificar';
    if(!sent.embeds?.[0] || !sent.components?.[0]) throw 'Se esperaba un mensaje de Feed válido';
    const channel = sent.channel;
    if(!channel) throw 'No se encontró un canal para el mensaje enviado';
    const guild = channel.guild;
    const matchingSuscriptions = feedSuscriptions.filter(suscription => suscription.followedTags.some(tag => post.tags.includes(tag)));
    const members = await guild.members.fetch();

    return Promise.all(matchingSuscriptions.map(async ({ userId, followedTags }) => {
        const member = members.get(userId);
        if(!channel || !member) return Promise.resolve(null);
        const translator = await Translator.from(member.id);
        const matchingTags = followedTags.filter(tag => post.tags.includes(tag));

        const userEmbed = new EmbedBuilder()
            .setColor(sent.embeds[0].color ?? 0)
            .setTitle(translator.getText('booruNotifTitle'))
            .setDescription(translator.getText('booruNotifDescription'))
            .setFooter({ text: translator.getText('dmDisclaimer') })
            .setThumbnail(post.previewUrl)
            .addFields(
                {
                    name: 'Feed',
                    value: `${channel}`,
                    inline: true,
                },
                {
                    name: translator.getText('booruNotifTagsName'),
                    value: `\`\`\`\n${matchingTags.join(' ')}\n\`\`\``,
                    inline: true,
                },
            );
        
        const postRow = makeButtonRowBuilder(sent.components[0]);
        postRow.components.splice(postRow.components.length - 2);
        postRow.addComponents(
            new ButtonBuilder()
                .setURL(sent.url)
                .setEmoji('1087075525245272104')
                .setStyle(ButtonStyle.Link),
        );

        return member.send({
            embeds: [userEmbed],
            components: [postRow],
        }).catch(_ => null);
    }));
}

/**
 * De naturaleza memética.
 * Comprueba si la búsqueda de tags de {@linkcode Booru} no es aprobada por Dios
 * @param {Boolean} isNsfw 
 * @param {ComplexCommandRequest} request 
 * @param {Array<String>} terms 
 * @returns {Boolean}
 */
function isUnholy(isNsfw, request, terms) {
    if(!isNsfw)
        return false;
    if(terms.includes('holo'))
        return true;
    if(!terms.includes('megumin'))
        return false;
    if(request.userId === globalConfigs.peopleid.papita)
        return false;

    return true;
}

/**
 * Busca las tags de {@linkcode Booru} deseadas y envía {@linkcode Message}s acorde a la petición
 * @param {ComplexCommandRequest} request
 * @param {CommandArguments} args
 * @param {Boolean} isSlash
 * @param {CommandOptions} options
 * @param {{ cmdtag: keyof tagMaps, nsfwtitle: String, sfwtitle: String }} [searchOpt]
 * @returns {Promise<Array<Message<true>> | Message<true>>}
 */
async function searchAndReplyWithPost(request, args, isSlash, options, searchOpt = { cmdtag: 'general', nsfwtitle: 'Búsqueda NSFW', sfwtitle: 'Búsqueda' }) {
    // @ts-ignore
    const isnsfw = isThread(request.channel)
        // @ts-ignore
        ? request.channel.parent.nsfw
        // @ts-ignore
        : request.channel.nsfw;
    
    const poolSize = options.fetchFlag(args, 'bomba', { callback: f => Math.max(2, Math.min(f, 10)), fallback: 1 });
    const words = isSlash
        // @ts-ignore
        ? (args.getString('etiquetas') ?? '').split(/ +/)
        : args;

    //Bannear lewds de Megumin y Holo >:C
    if(isUnholy(isnsfw, request, [ searchOpt.cmdtag, ...words ]))
        return rakki.execute(request, [], isSlash);

    await request.deferReply();

    const baseTags = getBaseTags('gelbooru', isnsfw);
    const searchTags = [ searchOpt.cmdtag, baseTags ].join(' ');
    const userTags = getSearchTags(words, 'gelbooru', searchOpt.cmdtag);
    /**@type {import('discord.js').User} */
    const author = request.user;
    
    //Petición
    try {
        // @ts-ignore
        const booru = new Booru(globalConfigs.booruCredentials);
        const response = await booru.search([ searchTags, userTags ], { limit: 100, random: true });
        //Manejo de respuesta
        if(!response.length) {
            const replyOptions = { content: `⚠️ No hay resultados en **Gelbooru** para las tags **"${userTags}"** en canales **${isnsfw ? 'NSFW' : 'SFW'}**` };
            // @ts-ignore
            return request.editReply(replyOptions);
        }

        //Seleccionar imágenes
        const posts = response
            .sort(() => 0.5 - Math.random())
            .slice(0, poolSize);

        //Crear presentaciones
        const messages = await Promise.all(posts.map(post => formatBooruPostMessage(booru, post, {
            maxTags: 40,
            title: isnsfw ? searchOpt.nsfwtitle : searchOpt.sfwtitle,
            cornerIcon: author.avatarURL({ size: 128 }),
            manageableBy: author.id,
            isNotFeed: true,
        })));
        if(userTags.length)
            // @ts-ignore
            messages[posts.length - 1].embeds[0].addFields({ name: 'Tu búsqueda', value: `:mag_right: *${userTags.trim().replace(/\*/g, '\\*').split(/ +/).join(', ')}*` });

        //Enviar mensajes
        const replyOptions = messages.shift();
        await request.editReply(replyOptions);
        return Promise.all(messages.map(message => request.channel.send(message))).catch(_ => console.error && []);
    } catch(error) {
        console.error(error);
        const errorembed = new EmbedBuilder()
            .setColor(Colors.Red)
            .addFields({
                name: 'Ocurrió un error al realizar una petición',
                value: [
                    'Es probable que le hayan pegado un tiro al que me suministra las imágenes, así que prueba buscar más tarde, a ver si revive 👉👈',
                    '```js',
                    `${[error.name, error.message].join(': ')}\n`,
                    '```',
                ].join('\n'),
            });
        // @ts-ignore
        return request.editReply({ embeds: [errorembed] });
    }
};

module.exports = {
    formatBooruPostMessage,
    notifyUsers,
    searchAndReplyWithPost,
}