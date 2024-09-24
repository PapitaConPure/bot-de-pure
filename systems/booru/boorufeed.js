const GuildConfig = require('../../localdata/models/guildconfigs.js');
const Discord = require('discord.js');
const { formatBooruPostMessage, notifyUsers } = require('./boorusend.js');
const { auditError, auditAction, auditSystem } = require('../others/auditor.js');
const chalk = require('chalk');
const { Booru } = require('./boorufetch.js');
const globalConfigs = require('../../localdata/config.json');
const { paginateRaw, sleep } = require('../../func.js');

//Configuraciones globales de actualización de Feeds
/**@type {Map<Discord.Snowflake, Map<Discord.Snowflake, Array<String>>>}*/
const feedTagSuscriptionsCache = new Map();
const feedUpdateInterval = 60e3 * 30;
const maxFeedDocuments = 32;
const chunkMax = 5;
const logMore = true;

/**
 * Discord es ciertamente una aplicación
 * @param {Array<Promise<Discord.Message<true> | void>>} messagesToSend
 */
async function correctEmbedsAfterSent(messagesToSend, ms = 8000) {
    try {
        /**@type {Array<Discord.Message<true>>}*/
        let messages = await Promise.all(messagesToSend);
        messages = messages.filter(message => message);
        if(!messages.length)
            return [];
        await sleep(ms);
        const correctedMessages = messages.map(message => {
            const embed = message.embeds[0];
            const newEmbed = Discord.EmbedBuilder.from(message.embeds[0]);
            if(embed.image.width > 0 && embed.image.height > 0)
                return Promise.resolve();
            newEmbed.setImage(embed.image.url);
            return message.edit({ embeds: [newEmbed] }).catch(console.error);
        });
        if(ms >= 32000)
            return correctedMessages;

        return correctEmbedsAfterSent(messagesToSend, ms * 2);
    } catch(e) {
        console.error(e);
        auditError(e, { brief: 'Ocurrió un error al corregir embeds de Feed' });
    }
}

// async function checkGuildFeeds(guild) {

// }

/**
 * @param {Booru} booru El Booru a comprobar
 * @param {Discord.Collection<Discord.Snowflake, Discord.Guild>} guilds Colección de Guilds a procesar
 */
async function checkFeeds(booru, guilds) {
    let promisesCount = { total: 0, feeds: 0 };
    await Promise.all(guilds.map(async guild => {
        promisesCount[guild] = 0;
        const gcfg = /**@type {import('../../localdata/models/guildconfigs.js').GuildConfigDocument}*/(await GuildConfig.findOne({ guildId: guild.id }).catch(console.error));
        if(!gcfg?.feeds) return;
        await Promise.all(Object.entries(gcfg.feeds).filter(([_, feed]) => !feed.faults || feed.faults < 10).map(/**@param {[String, import('./boorufetch.js').FeedData]}*/ async ([chid, feed]) => {
            //Recolectar últimas imágenes para el Feed
            let fetchedProperly = true;
            /**@type {Array<import('./boorufetch').Post>}*/
            const response = await booru.search(feed.tags, { limit: maxFeedDocuments })
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
                auditAction('Comprobando eliminación de un Feed no disponible',
                    { name: 'Servidor', value: `${guild}`, inline: true },
                    { name: 'Canal', value: `${channel ?? 'No disponible'}`, inline: true },
                    { name: 'Reintentos',  value: `${feed.faults + 1} / 10`, inline: true },
                );
                console.log(channel?.name, response.length);
                // if(feed.faults >= 10)
                //     delete gcfg.feeds[chid];
                // else
                if(feed.faults < 10) {
                    gcfg.feeds[chid].faults = feed.faults + 1;
                    gcfg.markModified('feeds');
                }

                return;
            }
            if(feed.faults > 0) {
                gcfg.feeds[chid].faults = Math.max(0, feed.faults - 2);
                gcfg.markModified('feeds');
            }

            //Preparar suscripciones a Feeds
            /**@type {Array<import('./boorusend.js').Suscription>}*/
            const feedSuscriptions = [];
            for(const [ userId , feedSuscription ] of feedTagSuscriptionsCache) {
                if(!feedSuscription.has(chid))
                    continue;
                const followedTags = feedSuscription.get(chid);
                feedSuscriptions.push({ userId, followedTags });
            }
            
            //Comprobar recolectado en busca de imágenes nuevas
            if(logMore) console.log(`Preparándose para enviar imágenes en ${channel.name} ${response.map(post => post.id)}`);
            /**@type {Array<Discord.Message<true>>}*/
            const messagesToSend = [];
            await Promise.all(response.reverse().map(async post => {
                //Revisar si el documento no fue anteriormente enviado por este Feed
                if(feed.ids.includes(post.id))
                    return;
                if(logMore) console.log('feed.ids:', feed.ids, '\npost.id:', post.id);

                //Agregar documento a IDs enviadas
                feed.ids.unshift(post.id);

                //Eliminar de la base de datos aquellas imágenes no coincidentes con lo encontrado
                gcfg.feeds[chid].ids = feed.ids.filter(id => response.some(p => p.id === id));
                if(logMore) console.log(guild.id, 'gcfg.feeds[chid].ids:', gcfg.feeds[chid].ids);
                gcfg.markModified('feeds');
                if(logMore) console.dir({ post });
                try {
                    const formatted = await formatBooruPostMessage(booru, post, feed);
                    const sent = await channel.send(formatted);
                    await notifyUsers(post, sent, feedSuscriptions);
                    messagesToSend.push(sent);
                } catch(error) {
                        console.log(`Ocurrió un error al enviar la imagen de Feed: ${post.source ?? post.id} para ${channel.name}`);
                        console.error(error);
                        auditError(error, { brief: 'Ocurrió un error al enviar una imagen de Feed', details: `\`Post<"${post.source ?? post.id}">\`\n${channel}` });
                }
                promisesCount[guild]++;
                promisesCount.total++;
                if(logMore) console.log(`EJECUTADO`);
            }));
            promisesCount.feeds++;

            //correctEmbedsAfterSent(messagesToSend);
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
async function updateBooruFeeds(guilds) {
    const booru = new Booru(globalConfigs.booruCredentials);
    // console.log(guilds);

    const startMs = Date.now();
    const promisesCount = await checkFeeds(booru, guilds)
    .catch(e => {
        console.error(e);
        return -1;
    });

    const delayMs = Date.now() - startMs;
    
    setTimeout(updateBooruFeeds, 60e3 * 30 - delayMs, guilds);
    auditAction('Se procesaron Feeds',
        { name: 'Servers',  value: `${guilds.size}`,         inline: true },
        { name: 'Feeds',    value: `${promisesCount.feeds}`, inline: true },
        { name: 'Imágenes', value: `${promisesCount.total}`, inline: true },
    );
};

/**@returns {Number}*/
function getNextBaseUpdateStart() {
    //Encontrar próximo inicio de fracción de hora para actualizar Feeds
    const now = new Date();
    let feedUpdateStart = feedUpdateInterval - (
        now.getMinutes() * 60e3 +
        now.getSeconds() * 1e3 +
        now.getMilliseconds());
    while(feedUpdateStart <= 0)
        feedUpdateStart += feedUpdateInterval;
    feedUpdateStart += 30e3; //Añadir 30 segundos para dar ventana de tiempo razonable al update de Gelbooru
    return feedUpdateStart;
};

/**
 * Inicializa una cadena de actualización de Feeds en todas las Guilds que cuentan con uno
 * @param {Discord.Client} client 
 */
async function setupGuildFeedUpdateStack(client) {
    const feedUpdateStart = getNextBaseUpdateStart();
    const guildConfigs = await GuildConfig.find({ feeds: { $exists: true } });
    /**@type {Array<{ tid: *, guilds: Array<[Discord.Snowflake, Discord.Guild]> }>}*/
    const guildChunks = paginateRaw(client.guilds.cache.filter(guild => guildConfigs.some(gcfg => gcfg.guildId === guild.id)), chunkMax)
        .map((g) => ({ tid: null, guilds: g }));
    const chunkAmount = guildChunks.length;
    let shortestTime;
    guildChunks.forEach((chunk, i) => {
        const guilds = new Discord.Collection(chunk.guilds);
        let chunkUpdateStart = feedUpdateStart + feedUpdateInterval * (i / chunkAmount);
        // console.log(i, (chunkUpdateStart - feedUpdateInterval));
        if((chunkUpdateStart - feedUpdateInterval) > 0)
            chunkUpdateStart -= feedUpdateInterval;
        if(!shortestTime || chunkUpdateStart < shortestTime)
            shortestTime = chunkUpdateStart;

        // console.log(new Date(now.getTime() + chunkUpdateStart).toString());
        guildChunks[i].tid = setTimeout(updateBooruFeeds, chunkUpdateStart, guilds);
    });
    globalConfigs.feedGuildChunks = guildChunks;

    auditAction('Se prepararon Feeds',
        { name: 'Primer Envío',   value: `<t:${Math.floor((Date.now() + shortestTime) * 0.001)}:R>`, inline: true },
        { name: 'Intervalo Base', value: `${feedUpdateInterval / 60e3} minutos`,                     inline: true },
        { name: 'Subdivisiones',  value: `${chunkAmount}`,                                           inline: true },
    );

    return;
};

/**
 * Añade la Guild actual a la cadena de actualización de Feeds su aún no está en ella
 * @param {Discord.Guild} guild 
 * @returns {Boolean} Si se añadió una nueva Guild o no
 */
function addGuildToFeedUpdateStack(guild) {
    //Retornar temprano si la guild ya está integrada al stack
    console.log(globalConfigs.feedGuildChunks)
    if(globalConfigs.feedGuildChunks.some(chunk => chunk.guilds.some(g => guild.id === g[0])))
        return false;

    //Añadir guild a stack en un chunk nuevo o uno ya definido
    /**@type {Array<{ tid: *, guilds: Array<[Discord.Snowflake, Discord.Guild]> }>}*/
    let guildChunks = globalConfigs.feedGuildChunks;
    const feedUpdateStart = getNextBaseUpdateStart();
    if(guildChunks[guildChunks.length - 1].guilds.length >= chunkMax) {
        //Subdividir 1 nivel más
        guildChunks.push({ tid: null, guilds: [[guild.id, guild]] });
        const chunkAmount = guildChunks.length;
        let shortestTime;
        guildChunks.forEach((chunk, i) => {
            let chunkUpdateStart = feedUpdateStart + feedUpdateInterval * (i / chunkAmount);
            if((chunkUpdateStart - feedUpdateInterval) > 0)
                chunkUpdateStart -= feedUpdateInterval;
            if(!shortestTime || chunkUpdateStart < shortestTime)
                shortestTime = chunkUpdateStart;

            clearTimeout(chunk.tid);
            guildChunks[i].tid = setTimeout(updateBooruFeeds, chunkUpdateStart, new Discord.Collection(chunk.guilds));
        });

        auditAction('Intervalos de Feed Reescritos',
            { name: 'Primer Envío',   value: `<t:${Math.floor((Date.now() + shortestTime) * 0.001)}:R>`, inline: true },
            { name: 'Subdivisiones',  value: `${chunkAmount}`, inline: true },
        );
    } else {
        //Añadir a última subdivisión
        guildChunks[guildChunks.length - 1].guilds.push([guild.id, guild]);
        const chunk = guildChunks[guildChunks.length - 1];
        const chunkAmount = guildChunks.length;
        const chunkUpdateStart = feedUpdateStart + feedUpdateInterval * (chunkAmount - 1) / chunkAmount;
        clearTimeout(chunk.tid);
        guildChunks[guildChunks.length - 1].tid = setTimeout(updateBooruFeeds, chunkUpdateStart, new Discord.Collection(chunk.guilds));
    }

    auditAction(`Guild ${guild.id} Incorporada a Feeds`);
    console.log(guildChunks);
    globalConfigs.feedGuildChunks = guildChunks;
    return true;
};

/**
 * Actualiza el caché de una suscripción de Feed de un usuario con las tags suministradas
 * @param {Discord.Snowflake} userId La ID del usuario suspcrito
 * @param {Discord.Snowflake} channelId La ID del canal del Feed al cuál está suscripto el usuario
 * @param {Array<String>} newTags Las tags con las cuáles reemplazar las actuales en caché
 * @returns {void}
 */
function updateFollowedFeedTagsCache(userId, channelId, newTags) {
    if(typeof userId !== 'string') throw ReferenceError('Se requiere una ID de usuario de tipo string');
    if(typeof channelId !== 'string') throw ReferenceError('Se requiere una ID de canal de tipo string');
    if(!Array.isArray(newTags)) throw TypeError('Las tags a incorporar deben ser un array');

	if(!feedTagSuscriptionsCache.has(userId))
        feedTagSuscriptionsCache.set(userId, new Map());

    let userMap = feedTagSuscriptionsCache.get(userId);
    
    if(newTags.length) {
        userMap.set(channelId, newTags);
        return;
    }

    userMap.delete(channelId);

    if(!userMap.size)
        feedTagSuscriptionsCache.delete(userId);

    return;
}

module.exports = {
    setupGuildFeedUpdateStack,
    addGuildToFeedUpdateStack,
    feedTagSuscriptionsCache,
    updateFollowedFeedTagsCache,
};