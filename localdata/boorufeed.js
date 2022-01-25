const GuildConfig = require('./models/guildconfigs.js');
const booru = require('booru');
const chalk = require('chalk');
const { Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    /**@param {Client} client*/
    async updateBooruFeeds(client) {
        //console.log(chalk.cyanBright('Comprobando actualizaciones en Feeds de imágenes...'));
        const feedCheckupStart = Date.now();
        const maxDocuments = 16;
        let feedsCount = 0;
        let promisesCount = { total: 0 };
        /** @type {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Guild>} */
        const guilds = client.guilds.cache;
        await Promise.all(guilds.map(async guild => {
            const logMore = guild.id === '654471968200065034';
            promisesCount[guild] = 0;
            const gcfg = await GuildConfig.findOne({ guildId: guild.id });
            if(!gcfg) return;
            for(const [chid, feed] of Object.entries(gcfg.feeds)) {
                feedsCount++;
                /*console.log('Determinando posibilidad de procesar feed...');
                if(promisesCount > maxDocuments) {
                    console.log('Se excedió el límite de envíos simultaneos establecido');
                    return;
                }
                console.log('Procesando feed');*/

                //Recolectar últimas imágenes para el Feed
                let fetchedProperly = true;
                const response = await booru.search('gelbooru', feed.tags, { limit: maxDocuments, random: false })
                .catch(error => {
                    console.log('Ocurrió un problema mientras se esperaban los resultados de búsqueda de un Feed');
                    console.error(error);
                    fetchedProperly = false;
                    return [ 'error' ];
                });
                if(!fetchedProperly) return;

                //Prepararse para enviar imágenes
                /** @type {import('discord.js').TextChannel} */
                const channel = guild.channels.cache.get(chid);
                const maxTags = feed.maxTags ?? 20;

                ///Eliminar Feed si las tags ingresadas no devuelven ninguna imagen
                if(typeof channel === 'undefined' || !response.length) {
                    console.log('Eliminando un Feed no disponible o sin resultados');
                    delete gcfg.feeds[chid];
                    gcfg.markModified('feeds');
                    return;
                }
                
                //Comprobar recolectado en busca de imágenes nuevas
                if(logMore) console.log(`Preparándose para enviar imágenes en ${channel.name} ${response.map(img => img.id)}`);
                response.reverse().forEach(image => {
                    //Revisar si el documento no fue anteriormente enviado por este Feed
                    if(feed.ids.includes(image.id)) return;
                    if(logMore) console.log('feed.ids:', feed.ids, '\nimage.id:', image.id);

                    //Agregar documento a IDs enviadas
                    feed.ids = [ image.id, ...feed.ids ];
                    gcfg.feeds[chid].ids = feed.ids.filter(id => response.some(img => img.id === id));
                    if(logMore) console.log(guild.id, 'gcfg.feeds[chid].ids:', gcfg.feeds[chid].ids);
                    gcfg.markModified('feeds');

                    //Botón de Post de Gelbooru
                    const row = new MessageActionRow().addComponents(
                        new MessageButton()
                            //.setLabel('Post')
                            .setEmoji('919398540172750878')
                            .setStyle('LINK')
                            .setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`),
                    );

                    //Botón de Fuente (si está disponible)
                    const addSourceButton = (source) => {
                        if(source.match(/(http:\/\/|https:\/\/)?(www\.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?/)) {
                            let emoji;
                            if(source.indexOf('pixiv.net') !== -1)
                                emoji = '919403803126661120';
                            else if(source.match(/twitter\.com|twimg\.com/))
                                emoji = '919403803114094682';
                            else
                                emoji = '919114849894690837';
                            row.addComponents(
                                new MessageButton()
                                    //.setLabel('Original')
                                    .setEmoji(emoji)
                                    .setStyle('LINK')
                                    .setURL(source),
                            );
                        }
                    };
                    const source = image.source;
                    if(source) {
                        if(typeof source === 'object')
                            Object.values(source).forEach(addSourceButton);
                        else
                            addSourceButton(source);
                    }
                        
                    
                    //Botón de tags (si es necesario) o de enlace
                    if(maxTags === 0 || image.tags.length > maxTags)
                        row.addComponents(
                            new MessageButton()
                                //.setLabel('Tags')
                                .setEmoji('921788204540100608')
                                .setStyle('PRIMARY')
                                .setCustomId('feed_showFeedImageTags'),
                        );
                    else
                        row.addComponents(
                            new MessageButton()
                                //.setLabel('Enlace')
                                .setEmoji('922669195521568818')
                                .setStyle('PRIMARY')
                                .setCustomId('feed_showFeedImageUrl'),
                        );
                    
                    //Botón de eliminación
                    row.addComponents(
                        new MessageButton()
                            //.setLabel('Recargar')
                            .setEmoji('935665140601327626')
                            .setStyle('PRIMARY')
                            .setCustomId('feed_shockFeed'),
                        new MessageButton()
                            //.setLabel('Eliminar')
                            .setEmoji('921751138997514290')
                            .setStyle('DANGER')
                            .setCustomId('feed_deleteFeedImage'),
                    );

                    //Preparar Embed final
                    /**@type {import('discord.js').MessageOptions} */
                    const feedMessage = { components: [row] };
                    const feedEmbed = new MessageEmbed()
                        .setColor('#608bf3')
                        .setAuthor('Desde Gelbooru', feed.cornerIcon ? feed.cornerIcon : 'https://i.imgur.com/outZ5Hm.png');
                    if(maxTags > 0)
                        feedEmbed.addField(`Tags (${Math.min(image.tags.length, maxTags)}/${image.tags.length})`, `*${image.tags.slice(0, maxTags).join(', ').replace(/\\*\*/g,'\\*').replace(/\\*_/g,'\\_')}*`);
                    if(feed.title)
                        feedEmbed.setTitle(feed.title);
                    if(feed.footer)
                        feedEmbed.setFooter(feed.footer);
                    if(image.fileUrl.match(/\.(mp4|webm|webp)/)) {
                        feedEmbed.addField('Video', `Míralo en su respectivo <:gelbooru:919398540172750878> **Post**\n[Enlace directo](${image.fileUrl})`);
                        feedEmbed.setImage(image.sampleUrl || image.previewUrl);
                    } else
                        feedEmbed.setImage(image.sampleUrl || image.fileUrl);
                    feedMessage.embeds = [feedEmbed];
                    
                    //Enviar imagen de Feed
                    promisesCount[guild]++;
                    promisesCount.total++;
                    channel.send(feedMessage).catch(error => {
                        console.log(`Ocurrió un error al enviar la imagen de Feed: ${source}`);
                        console.error(error);
                    });
                    if(logMore) console.log(`EJECUTADO`);
                });
            }

            if(logMore) console.log(`GUARDANDO:`, Object.entries(gcfg.feeds).map(([chid, feed]) => `${guild.channels.cache.get(chid).name}: ${feed.ids}`));
            await gcfg.save();
        }));

        setTimeout(module.exports.updateBooruFeeds, 1000 * 60, client);
        console.log(chalk.green(`Se procesaron ${feedsCount} Feeds desde ${guilds.size} servers en ${(Date.now() - feedCheckupStart) / 1000}s. ${promisesCount.total} imágenes nuevas puestas en envío`));
    },
}