const GuildConfig = require('../localdata/models/guildconfigs.js');
const booru = require('booru');
const { Client, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { formatBooruPostMessage } = require('./boorusend.js');
const { auditError } = require('./auditor.js');
const chalk = require('chalk');

const logMore = false;

/**
 * 
 * @param {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Guild>} guilds Colección de Guilds a procesar
 * @returns {Object} Cantidad de imágenes enviadas
 */
const checkFeeds = async (guilds) => {
    const maxDocuments = 16;
    let promisesCount = { total: 0 };
    await Promise.all(guilds.map(async guild => {
        promisesCount[guild] = 0;
        const gcfg = await GuildConfig.findOne({ guildId: guild.id }).catch(console.error);
        if(!gcfg?.feeds) return;
        await Promise.all(Object.entries(gcfg.feeds).map(async ([chid, feed]) => {
            //Recolectar últimas imágenes para el Feed
            let fetchedProperly = true;
            const response = await booru.search('gelbooru', feed.tags, { limit: maxDocuments, random: false })
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
            if(typeof channel === 'undefined' || !response.length) {
                console.log('Comprobando eliminación de un Feed no disponible');
                console.log(channel, response);
                if(feed.faults > 10) {
                    delete gcfg.feeds[chid];
                    gcfg.markModified('feeds');
                } else {
                    gcfg.feeds[chid].faults = feed.faults + 1;
                    gcfg.markModified('faults');
                }
                return;
            } else if(feed.faults > 0){
                gcfg.feeds[chid].faults = 0
                gcfg.markModified('faults');
            }
            
            //Comprobar recolectado en busca de imágenes nuevas
            if(logMore) console.log(`Preparándose para enviar imágenes en ${channel.name} ${response.map(img => img.id)}`);
            response.reverse().forEach(post => {
                //Revisar si el documento no fue anteriormente enviado por este Feed
                if(feed.ids.includes(post.id)) return;
                if(logMore) console.log('feed.ids:', feed.ids, '\nimage.id:', post.id);

                //Agregar documento a IDs enviadas
                feed.ids.unshift(post.id);

                //Eliminar de la base de datos aquellas imágenes no coincidentes con lo encontrado
                gcfg.feeds[chid].ids = feed.ids.filter(id => response.some(p => p.id === id));
                if(logMore) console.log(guild.id, 'gcfg.feeds[chid].ids:', gcfg.feeds[chid].ids);
                gcfg.markModified('feeds');

                channel.send(formatBooruPostMessage(post, feed)).catch(error => {
                    console.log(`Ocurrió un error al enviar la imagen de Feed: ${source}`);
                    console.error(error);
                    auditError(error, { brief: 'Ocurrió un error al enviar una imagen de Feed', details: source });
                });
                promisesCount[guild]++;
                promisesCount.total++;
                if(logMore) console.log(`EJECUTADO`);
            });
        }));

        if(logMore) console.log(`GUARDANDO:`, Object.entries(gcfg.feeds).map(([chid, feed]) => `${guild.channels.cache.get(chid).name}: ${feed.ids}`));
        await gcfg.save();
    }));
    return promisesCount;
}

/**
 * @param {Client} client
 * @returns {void}
 */
const updateBooruFeeds = async (client) => {
    /** @type {import('discord.js').Collection<import('discord.js').Snowflake, import('discord.js').Guild>} */
    const guilds = client.guilds.cache;

    const startMs = Date.now();
    const promisesCount = await checkFeeds(guilds)
    .catch(e => {
        console.error(e);
        return -1;
    });

    const delayMs = Date.now() - startMs;
    // console.log(new Date(Date.now() + 1000 * 60 * 15 - delayMs).toString(), '| delayMs:', delayMs);
    setTimeout(updateBooruFeeds, 1000 * 60 * 15 - delayMs, client);
    console.log(`Se procesaron Feeds de ${guilds.size} servers. ${promisesCount.total} imágenes nuevas puestas en envío`);
};

module.exports = {
    updateBooruFeeds,
};