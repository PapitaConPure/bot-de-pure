const GuildConfig = require('./models/guildconfigs.js');
const booru = require('booru');
const chalk = require('chalk');
const { Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    /**@param {Client} client*/
    async updateBooruFeeds(client) {
        console.log(chalk.cyanBright('Comprobando actualizaciones en Feeds de imágenes...'));
        const feedCheckupStart = Date.now();
        const maxDocuments = 16;
        /** @type {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Guild>} */
        const guilds = client.guilds.cache;
        await Promise.all(guilds.map(async guild => {
            const gcfg = await GuildConfig.findOne({ guildId: guild.id });
            if(!gcfg) return;
            let feedcnt = 0;
            for(const [chid, feed] of Object.entries(gcfg.feeds)) {
                feedcnt++;
                /** @type {import('discord.js').TextChannel} */
                const channel = guild.channels.cache.get(chid);
                const response = await booru.search('gelbooru', feed.tags, { limit: maxDocuments, random: false });
                const maxTags = feed.maxTags ?? 20;

                ///Eliminar Feed si las tags ingresadas no devuelven ninguna imagen
                if(typeof channel === 'undefined' || !response.length) {
                    delete gcfg.feeds[chid];
                    gcfg.markModified('feeds');
                    return;
                }
                
                response.reverse().forEach(image => {
                    if(feed.ids.includes(image.id)) return;

                    feed.ids = [ image.id, ...feed.ids ];
                    gcfg.feeds[chid].ids = feed.ids.filter(id => response.some(img => img.id === id));
                    gcfg.markModified('feeds');

                    const row = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setLabel('Post')
                            .setEmoji('919398540172750878')
                            .setStyle('LINK')
                            .setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`),
                    );

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
                                .setLabel('Original')
                                .setEmoji(emoji)
                                .setStyle('LINK')
                                .setURL(source),
                        );
                    }

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
                        feedEmbed.addField('No se pudo mostrar la vista previa aquí', 'El archivo se envió fuera del marco. Puede que aun así no se vea');
                    } else
                        feedEmbed.setImage(image.fileUrl);
                    feedMessage.embeds = [feedEmbed];
                    console.log(`Embed: ${feedEmbed.image}\nReflejado en mensaje: ${feedMessage.embeds[0].image}`);

                    channel.send(feedMessage).catch(() => console.log(chalk.red('Error de tiempo de espera en Feed')));
                });
            }

            await gcfg.save();
            console.log(chalk.gray(feedcnt === 1
                ? `Se comprobó    1 Feed  en ${guild.name}`
                : `Se comprobaron ${feedcnt} Feeds en ${guild.name}`
            ));
        }));

        setTimeout(module.exports.updateBooruFeeds, 1000 * 60, client);
        console.log(chalk.green(`Lectura global de Feeds procesada en ${(Date.now() - feedCheckupStart) / 1000}s`));
    },
}