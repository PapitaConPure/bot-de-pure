const GuildConfig = require('../localdata/models/guildconfigs.js');
const Discord = require('discord.js');
const { formatBooruPostMessage } = require('./boorusend.js');
const { auditError, auditAction } = require('./auditor.js');
const chalk = require('chalk');
const { Booru } = require('./boorufetch.js');
const { booruCredentials } = require('../localdata/config.json');

const logMore = false;

const correctFeedMessages = async (messages) => {
    messages.forEach(message => {

    });
}

/**
 * @param {Booru} booru
 * @param {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Guild>} guilds Colección de Guilds a procesar
 * @returns {Object} Cantidad de imágenes enviadas
 */
const checkFeeds = async (booru, guilds) => {
    const maxDocuments = 32;
    let promisesCount = { total: 0, feeds: 0 };
    await Promise.all(guilds.map(async guild => {
        promisesCount[guild] = 0;
        const gcfg = await GuildConfig.findOne({ guildId: guild.id }).catch(console.error);
        if(!gcfg?.feeds) return;
        await Promise.all(Object.entries(gcfg.feeds).map(async ([chid, feed]) => {
            //Recolectar últimas imágenes para el Feed
            let fetchedProperly = true;
            /**@type {Array<import('./boorufetch').Post>}*/
            const response = await booru.search(feed.tags, { limit: maxDocuments })
            .catch(error => {
                console.log(chalk.redBright('Ocurrió un problema mientras se esperaban los resultados de búsqueda de un Feed'));
                console.log({
                    guildName: guild.name,
                    channelId: chid,
                    feedStack: feed.ids,
                    feedTags: feed.tags,
                });
                console.error(error);
                fetchedProperly = false;
                return [ 'error' ];
            });
            if(!fetchedProperly) return;

            //Prepararse para enviar imágenes
            /** @type {import('discord.js').TextChannel} */
            const channel = guild.channels.cache.get(chid);

            ///Eliminar Feed si las tags ingresadas no devuelven ninguna imagen
            feed.faults ??= 0;
            if(channel == undefined || !response.length) {
                console.log('Comprobando eliminación de un Feed no disponible');
                console.log(channel?.name, response.length);
                if(feed.faults >= 10)
                    delete gcfg.feeds[chid];
                else
                    gcfg.feeds[chid].faults = feed.faults + 1;
                gcfg.markModified('feeds');
                return;
            }
            if(feed.faults > 0) {
                gcfg.feeds[chid].faults = Math.max(0, feed.faults - 2);
                gcfg.markModified('feeds');
            }
            
            //Comprobar recolectado en busca de imágenes nuevas
            if(logMore) console.log(`Preparándose para enviar imágenes en ${channel.name} ${response.map(post => post.id)}`);
            /**@type {Array<Promise<Discord.Message>>}*/
            const messagesToSend = [];
            response.reverse().forEach(post => {
                //Revisar si el documento no fue anteriormente enviado por este Feed
                if(feed.ids.includes(post.id)) return;
                if(logMore) console.log('feed.ids:', feed.ids, '\npost.id:', post.id);

                //Agregar documento a IDs enviadas
                feed.ids.unshift(post.id);

                //Eliminar de la base de datos aquellas imágenes no coincidentes con lo encontrado
                gcfg.feeds[chid].ids = feed.ids.filter(id => response.some(p => p.id === id));
                if(logMore) console.log(guild.id, 'gcfg.feeds[chid].ids:', gcfg.feeds[chid].ids);
                gcfg.markModified('feeds');

                messagesToSend.push(channel.send(formatBooruPostMessage(post, feed)).catch(error => {
                    console.log(`Ocurrió un error al enviar la imagen de Feed: ${post.source ?? post.id} para ${channel.name}`);
                    console.error(error);
                    auditError(error, { brief: 'Ocurrió un error al enviar una imagen de Feed', details: `\`Post<"${post.source ?? post.id}">\`\n${channel}` });
                }));
                promisesCount[guild]++;
                promisesCount.total++;
                if(logMore) console.log(`EJECUTADO`);
            });
            promisesCount.feeds++;
            
            Promise.all(messagesToSend)
            .then(messages => {
                messages = messages.filter(message => message);
                messages.forEach(message => {
                    const embed = message.embeds[0];
                    if(embed.image.width === 0 && embed.image.height === 0) {
                        // embed.setImage(message.components[0].components[0].url);
                        embed.setImage(embed.image.url);
                        message.edit({ embeds: [embed] }).catch(auditError);
                    }
                });
            }).catch(auditError);
        }));

        if(logMore) console.log(`GUARDANDO:`, Object.entries(gcfg.feeds).map(([chid, feed]) => `${guild.channels.cache.get(chid).name}: ${feed.ids}`));
        await gcfg.save();
    }));

    return promisesCount;
}

/**
 * @param {Discord.Collection<Discord.Snowflake, Discord.Guild>} guilds
 * @returns {Promise<void>}
 */
const updateBooruFeeds = async (guilds) => {
    const booru = new Booru(booruCredentials);
    // console.log(guilds);

    const startMs = Date.now();
    const promisesCount = await checkFeeds(booru, guilds)
    .catch(e => {
        console.error(e);
        return -1;
    });

    const delayMs = Date.now() - startMs;
    // console.log(new Date(Date.now() + 1000 * 60 * 15 - delayMs).toString(), '| delayMs:', delayMs);
    setTimeout(updateBooruFeeds, 60e3 * 30 - delayMs, guilds);
    auditAction('Se procesaron Feeds',
        { name: 'Servers',  value: `${guilds.size}`,         inline: true },
        { name: 'Feeds',    value: `${promisesCount.feeds}`, inline: true },
        { name: 'Imágenes', value: `${promisesCount.total}`, inline: true },
    );
};

module.exports = {
    updateBooruFeeds,
};