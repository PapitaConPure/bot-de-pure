const GuildConfig = require('./models/guildconfigs.js');
const booru = require('booru');
const { Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    /**@param {Client} client*/
    async updateBooruFeeds(client) {
        /**@type {Array<Object>} */
        const maxDocuments = 16;
        const maxTags = 20;
        const guilds = client.guilds.cache;
        guilds.forEach(async guild => {
            const gcfg = await GuildConfig.findOne({ guildId: guild.id });
            if(!gcfg) return;
            const bulkSave = [];
            for(const [chid, feed] of Object.entries(gcfg.feeds)) {
                const channel = guild.channels.cache.get(chid);
                const response = await booru.search('gelbooru', feed.tags, { limit: maxDocuments, random: false });
                if(!response.length) {
                    delete gcfg.feeds[chid];
                    gcfg.markModified('feeds');
                } else {
                    response.reverse().forEach(image => {
                        if(!feed.ids.includes(image.id)) {
                            gcfg.feeds[chid].ids = [ image.id, ...gcfg.feeds[chid].ids ].slice(0, maxDocuments);
                            gcfg.markModified('feeds');
                            const row = new MessageActionRow().addComponents(
                                new MessageButton()
                                    .setLabel('Gelbooru')
                                    .setStyle('LINK')
                                    .setURL(`https://gelbooru.com/index.php?page=post&s=view&id=${image.id}`),
                            );
                            const source = Array.isArray(image.source) ? image.source[0] : (image.source || undefined);
                            console.log(source, source && source.match(/((http:\/\/|https:\/\/)?(www.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?)/));
                            if(source && source.match(/((http:\/\/|https:\/\/)?(www.)?(([a-zA-Z0-9-]){2,}\.){1,4}([a-zA-Z]){2,6}(\/([a-zA-Z-_\/\.0-9#:?=&;,]*)?)?)/))
                                row.addComponents(
                                    new MessageButton()
                                        .setLabel('Original')
                                        .setStyle('LINK')
                                        .setURL(source),
                                );
                            
                            channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor('#608bf3')
                                        .setAuthor('Desde Gelbooru', 'https://i.imgur.com/outZ5Hm.png')
                                        //.setTitle(feed.tags.split(/ +/g).slice(0, 3).join(' ').replace(/rating:/g, ''))
                                        .addField(`Tags (${Math.min(image.tags.length, maxTags)}/${image.tags.length})`, `*${image.tags.slice(0,maxTags).join(', ').replace(/\\*\*/g,'\\*').replace(/\\*_/g,'\\_')}*`)
                                        //.addField('Salsa', [
                                        //    `[Gelbooru](https://gelbooru.com/index.php?page=post&s=view&id=${image.id})`,
                                        //    image.source ? `[Original](${image.source})` : null
                                        //].join('\n'))
                                        .setImage(image.fileUrl)
                                ],
                                components: [row],
                            });
                        }
                    });
                }

                bulkSave.push(gcfg.save());
            }
            await Promise.all(bulkSave);
        })

        setTimeout(module.exports.updateBooruFeeds, 1000 * 60, client);
    },
}