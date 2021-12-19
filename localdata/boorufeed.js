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
        let promisesCount = 0;
        /** @type {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Guild>} */
        const guilds = client.guilds.cache;
        await Promise.all(guilds.map(async guild => {
            const gcfg = await GuildConfig.findOne({ guildId: guild.id });
            if(!gcfg) return;
            for(const [chid, feed] of Object.entries(gcfg.feeds)) {
                feedsCount++;
                if(promisesCount > maxDocuments) return;

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
                    delete gcfg.feeds[chid];
                    gcfg.markModified('feeds');
                    return;
                }
                
                //Comprobar recolectado en busca de imágenes nuevas
                response.reverse().forEach(image => {
                    //Revisar si el documento no fue anteriormente enviado por este Feed
                    if(feed.ids.includes(image.id)) return;

                    //Agregar documento a IDs enviadas
                    feed.ids = [ image.id, ...feed.ids ];
                    gcfg.feeds[chid].ids = feed.ids.filter(id => response.some(img => img.id === id));
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
                    const source = Array.isArray(image.source) ? image.source[0] : (image.source || undefined);
                    if(source && source.match(/(http:\/\/|https:\/\/)?(www\.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?/)) {
                        let emoji;
                        if(source.indexOf('pixiv.net') !== -1)
                            emoji = '919403803126661120';
                        else if(source.indexOf('twitter.com') !== -1)
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
                    
                    //Botón de tags (si es necesario)
                    if(maxTags === 0 || image.tags.length > maxTags)
                        row.addComponents(
                            new MessageButton()
                                //.setLabel('Tags')
                                .setEmoji('921788204540100608')
                                .setStyle('PRIMARY')
                                .setCustomId('feed_showFeedImageTags'),
                        );
                    
                    //Botón de eliminación
                    row.addComponents(
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
                        feedMessage.files = [image.fileUrl];
                        feedEmbed.addField('No se pudo mostrar la vista previa aquí', 'La vista previa se enviará fuera del marco');
                    } else
                        feedEmbed.setImage(image.fileUrl);
                    feedMessage.embeds = [feedEmbed];
                    
                    //Enviar imagen de Feed
                    channel.send(feedMessage).catch(console.error);
                });
            }

            await gcfg.save();
        }));

        setTimeout(module.exports.updateBooruFeeds, 1000 * 60, client);
        console.log(chalk.green(`Se procesaron ${feedsCount} Feeds desde ${guilds.size} servers en ${(Date.now() - feedCheckupStart) / 1000}s. ${promisesCount} imágenes nuevas puestas en envío`));
    },
}