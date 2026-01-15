import { Booru } from './boorufetch';
import GuildConfigs from '../../models/guildconfigs';
import { formatBooruPostMessage, notifyUsers, PostFormatData, Suscription } from './boorusend';
import { Client, Collection, Guild, GuildBasedChannel, GuildTextBasedChannel, MessageFlags, Snowflake } from 'discord.js';
import { globalConfigs, booruApiKey, booruUserId, noDataBase } from '../../data/globalProps';
import { fetchGuildMembers } from '../../utils/guildratekeeper';
import { auditError, auditAction } from '../others/auditor';
import { paginateRaw } from '../../func';
import chalk from 'chalk';

//import Logger from '../../logs';
//const { debug } = Logger('WARN', 'BooruSend');

export interface FeedData extends PostFormatData {
    tags: string;
    lastFetchedAt?: Date;
    faults?: number;
};

//Configuraciones globales de actualización de Feeds
export const feedTagSuscriptionsCache: Map<Snowflake, Map<Snowflake, Array<string>>> = new Map();

const FEED_UPDATE_INTERVAL = 60e3 * 30;
const FEED_UPDATE_MAX_POST_COUNT = 32;
const FEED_BATCH_MAX_COUNT = 5;
const LOG_MORE = false;

async function updateBooruFeeds(guilds: Collection<Snowflake, Guild>): Promise<void> {
    const booru = new Booru({ apiKey: booruApiKey, userId: booruUserId });
    const startMs = Date.now();

    await processFeeds(booru, guilds).catch(console.error);
    Booru.cleanupTagsCache();

    const delayMs = Date.now() - startMs;
    setTimeout(updateBooruFeeds, 60e3 * 30 - delayMs, guilds);
    auditAction('Se procesaron Feeds',
        { name: 'Servers', value: `${guilds.size}`, inline: true },
    );
};

/**
 * @param booru El Booru a comprobar
 * @param guilds Colección de Guilds a procesar
 */
async function processFeeds(booru: Booru, guilds: Collection<Snowflake, Guild>) {
    if(noDataBase) return;

    const guildIds = guilds.map(g => g.id);
    const guildConfigs = await GuildConfigs.find({
        guildId: { $in: guildIds },
        feeds: { $exists: true, $ne: {} },
    });

    const bulkOps = [];
    await Promise.all(guildConfigs.map(async gcfg => {
        const guild = guilds.get(gcfg.guildId);
        if(!guild) return;

        await fetchGuildMembers(guild);
        const members = guild.members.cache;

        await Promise.all(Object.entries(gcfg.feeds).map(async ([ channelId, feedData ]) => {
            const feed = new BooruFeed(booru, guild.channels.cache.get(channelId), feedData.tags, feedData);
            if(!feed.isRunning) return;
            if(!feed.isProcessable)
                return feed.faults < 10 && bulkOps.push(feed.addFault());

            //Recolectar últimas imágenes para el Feed
            const { success, posts, newPosts } = await feed.fetchPosts();
            if(!success) return;
            if(!posts.length)
                return feed.faults < 10 && bulkOps.push(feed.addFault());
            if(!newPosts.length) 
                return bulkOps.push(feed.reduceFaults());

            /**@type {Partial<FeedData>}*/
            const toSave: Partial<FeedData> = {};

            if(feed.faults > 0)
                toSave.faults = Math.max(0, feed.faults - 2);

            //Preparar suscripciones a Feeds
            const feedSuscriptions: Suscription[] = [];
            for(const [ userId, feedSuscription ] of feedTagSuscriptionsCache) {
                if(!feedSuscription.has(channelId)) continue;

                const followedTags = feedSuscription.get(channelId);
                feedSuscriptions.push({ userId, followedTags });
            }
            
            //Comprobar recolectado en busca de imágenes nuevas
            const channel = feed.channel;
            const messagesToSend = /**@type {Array<Message<true>>}*/([]);
            await Promise.all(newPosts.map(async post => {
                try {
                    const formattedContainer = await formatBooruPostMessage(booru, post, feed);
                    const sent = await feed.channel.send({ flags: MessageFlags.IsComponentsV2, components: [formattedContainer] });
                    await notifyUsers(post, sent, members, feedSuscriptions);
                    messagesToSend.push(sent);
                } catch(error) {
                    console.log(`Ocurrió un error al enviar la imagen de Feed: ${post.source ?? post.id} para ${channel.name}`);
                    console.error(error);
                    auditError(error, { brief: 'Ocurrió un error al enviar una imagen de Feed', details: `\`Post<"${post.source ?? post.id}">\`\n${channel}` });
                }
            }));

            //Eliminar aquellos Posts no coincidentes con lo encontrado y guardar
            toSave.lastFetchedAt = feed.lastFetchedAt;

            const $set = {};
            for(const [ key, value ] of Object.entries(toSave))
                $set[`feeds.${channelId}.${key}`] = value;

            return bulkOps.push({
                updateOne: {
                    filter: { guildId: gcfg.guildId },
                    update: { $set },
                },
            });
        }));
    }));

    LOG_MORE && console.dir(bulkOps, { depth: null });
    if(bulkOps.length)
        await GuildConfigs.bulkWrite(bulkOps);
}

function getNextBaseUpdateStart(): number {
    //Encontrar próximo inicio de fracción de hora para actualizar Feeds
    const now = new Date();
    let feedUpdateStart = FEED_UPDATE_INTERVAL - (
        now.getMinutes() * 60e3 +
        now.getSeconds() * 1e3 +
        now.getMilliseconds());
    while(feedUpdateStart <= 0)
        feedUpdateStart += FEED_UPDATE_INTERVAL;
    feedUpdateStart += 30e3; //Añadir 30 segundos para dar ventana de tiempo razonable al update de Gelbooru
    return feedUpdateStart;
};

interface GuildFeedChunk {
    timestamp: Date;
    tid: NodeJS.Timeout;
    guilds: Array<[Snowflake, Guild]>;
}

/**@description Inicializa una cadena de actualización de Feeds en todas las Guilds que cuentan con uno.*/
export async function setupGuildFeedUpdateStack(client: Client) {
    if(noDataBase) return;

    const feedUpdateStart = getNextBaseUpdateStart();
    const guildConfigs = await GuildConfigs.find({ feeds: { $exists: true } });
    /**@type {Array<GuildFeedChunk>}*/
    const guildChunks: Array<GuildFeedChunk> = paginateRaw(client.guilds.cache.filter(guild => guildConfigs.some(gcfg => gcfg.guildId === guild.id)), FEED_BATCH_MAX_COUNT)
        .map((g) => ({ tid: null, guilds: g, timestamp: null }));
    const chunkAmount = guildChunks.length;
    let shortestTime = 0;
    guildChunks.forEach((chunk, i) => {
        const guilds = new Collection(chunk.guilds);
        let chunkUpdateStart = feedUpdateStart + FEED_UPDATE_INTERVAL * (i / chunkAmount);
        if((chunkUpdateStart - FEED_UPDATE_INTERVAL) > 0)
            chunkUpdateStart -= FEED_UPDATE_INTERVAL;
        if(!shortestTime || chunkUpdateStart < shortestTime)
            shortestTime = chunkUpdateStart;

        guildChunks[i].tid = setTimeout(updateBooruFeeds, chunkUpdateStart, guilds);
        guildChunks[i].timestamp = new Date(Date.now() + chunkUpdateStart);
    });
    globalConfigs['feedGuildChunks'] = guildChunks;

    auditAction('Se prepararon Feeds',
        { name: 'Primer Envío',   value: `<t:${Math.floor((Date.now() + shortestTime) * 0.001)}:R>`, inline: true },
        { name: 'Intervalo Base', value: `${FEED_UPDATE_INTERVAL / 60e3} minutos`,                   inline: true },
        { name: 'Subdivisiones',  value: `${chunkAmount}`,                                           inline: true },
    );

    return;
};

/**
 * @description Añade la Guild actual a la cadena de actualización de Feeds si aún no está en ella
 * @returns La cantidad de milisegundos que faltan para actualizar el Feed añadido por primera vez, ó -1 si no se pudo agregar
 */
export function addGuildToFeedUpdateStack(guild: Guild): number {
    if(!('feedGuildChunks' in globalConfigs))
        return -1;

    if(!Array.isArray(globalConfigs.feedGuildChunks))
        return -1;

    /**@type {Array<GuildFeedChunk>}*/
    const guildChunks: Array<GuildFeedChunk> = globalConfigs.feedGuildChunks;
    const chunkAmount = guildChunks.length;

    //Retornar temprano si la guild ya está integrada al stack
    const chunkIndexWithThisGuild = guildChunks.findIndex(chunk => chunk.guilds.some(g => guild.id === g[0]));
    if(chunkIndexWithThisGuild)
        return getNextBaseUpdateStart() + FEED_UPDATE_INTERVAL * (chunkIndexWithThisGuild / chunkAmount);

    //Añadir guild a stack en un chunk nuevo o uno ya definido
    const feedUpdateStart = getNextBaseUpdateStart();
    let newGuildChunkUpdateDelay = 0;
    if(guildChunks[guildChunks.length - 1].guilds.length >= FEED_BATCH_MAX_COUNT) {
        //Subdividir 1 nivel más
        guildChunks.push({ tid: null, guilds: [[guild.id, guild]], timestamp: null });
        const chunkAmount = guildChunks.length;
        let shortestTime = 0;
        guildChunks.forEach((chunk, i) => {
            let chunkUpdateStart = feedUpdateStart + FEED_UPDATE_INTERVAL * (i / chunkAmount);
            if((chunkUpdateStart - FEED_UPDATE_INTERVAL) > 0)
                chunkUpdateStart -= FEED_UPDATE_INTERVAL;
            if(!shortestTime || chunkUpdateStart < shortestTime)
                shortestTime = chunkUpdateStart;

            clearTimeout(chunk.tid);
            guildChunks[i].tid = setTimeout(updateBooruFeeds, chunkUpdateStart, new Collection(chunk.guilds));
            guildChunks[i].timestamp = new Date(Date.now() + chunkUpdateStart);
        });

        newGuildChunkUpdateDelay = +guildChunks[chunkAmount - 1].timestamp - Date.now();

        auditAction('Intervalos de Feed Reescritos',
            { name: 'Primer Envío',   value: `<t:${Math.floor((Date.now() + shortestTime) * 0.001)}:R>`, inline: true },
            { name: 'Subdivisiones',  value: `${chunkAmount}`, inline: true },
        );
    } else {
        //Añadir a última subdivisión
        guildChunks[guildChunks.length - 1].guilds.push([guild.id, guild]);
        const chunk = guildChunks[guildChunks.length - 1];
        const chunkAmount = guildChunks.length;
        newGuildChunkUpdateDelay = feedUpdateStart + FEED_UPDATE_INTERVAL * (chunkAmount - 1) / chunkAmount;
        clearTimeout(chunk.tid);
        guildChunks[guildChunks.length - 1].tid = setTimeout(updateBooruFeeds, newGuildChunkUpdateDelay, new Collection(chunk.guilds));
        guildChunks[guildChunks.length - 1].timestamp = new Date(Date.now() + newGuildChunkUpdateDelay);
    }

    auditAction(`Guild ${guild.id} Incorporada a Feeds`);
    globalConfigs.feedGuildChunks = guildChunks;
    return newGuildChunkUpdateDelay;
};

/**
 * @description Actualiza el caché de una suscripción de Feed de un usuario con las tags suministradas
 * @param userId La ID del usuario suspcrito
 * @param channelId La ID del canal del Feed al cuál está suscripto el usuario
 * @param newTags Las tags con las cuáles reemplazar las actuales en caché
 */
export function updateFollowedFeedTagsCache(userId: Snowflake, channelId: Snowflake, newTags: Array<string>): void {
    if(typeof userId !== 'string') throw ReferenceError('Se requiere una ID de usuario de tipo string');
    if(typeof channelId !== 'string') throw ReferenceError('Se requiere una ID de canal de tipo string');
    if(!Array.isArray(newTags)) throw TypeError('Las tags a incorporar deben ser un array');

	if(!feedTagSuscriptionsCache.has(userId))
        feedTagSuscriptionsCache.set(userId, new Map());

    const userMap = feedTagSuscriptionsCache.get(userId);
    
    if(newTags.length) {
        userMap.set(channelId, newTags);
        return;
    }

    userMap.delete(channelId);

    if(!userMap.size)
        feedTagSuscriptionsCache.delete(userId);

    return;
}

interface FeedOptions {
    lastFetchedAt?: Date;
    faults?: number;
    maxTags?: number;
    cornerIcon?: string;
    title?: string;
    subtitle?: string;
    footer?: string;
}

/**@class Representa un Feed programado de imágenes de {@linkcode Booru}.*/
export class BooruFeed {
    booru: Booru;
    channel: GuildTextBasedChannel;
    tags: string;

    lastFetchedAt: Date;
    faults: number;
    maxTags: number;
    cornerIcon: string;
    title: string;
    subtitle: string;
    footer: string;

    /**
     * @description Crea una representación de un Feed programado de imágenes de {@linkcode Booru}.
     * @throws {TypeError}
     */
    constructor(booru: Booru, channel: GuildBasedChannel, tags: string, options = undefined) {
        this.booru = booru;
        this.channel = channel?.isTextBased() ? channel : null;
        this.tags = tags;
        
        options ??= {};
        this.lastFetchedAt = options.lastFetchedAt ?? new Date(Math.floor(Date.now() - FEED_UPDATE_INTERVAL / 2));
        this.faults = options.faults ?? 0;
        this.maxTags = options.maxTags ?? 20;
        this.cornerIcon = options.cornerIcon ?? null;
        this.title = options.title ?? null;
        this.subtitle = options.subtitle ?? null;
        this.footer = options.footer ?? null;
    }

    get isProcessable() {
        if(!this.booru || !this.channel || !this.tags)
            return false;

        return this.channel.id
            && this.channel.guild
            && this.channel.guild.channels.cache.has(this.channel.id);
    }

    get isRunning() {
        return !this.faults || this.faults < 10;
    }

    /**@description Obtiene {@linkcode Post}s que no han sido publicados.*/
    async fetchPosts(): Promise<{ success: true; posts: Array<import('./boorufetch').Post>; newPosts: Array<import('./boorufetch').Post>; } | { success: false; posts: []; newPosts: []; }> {
        try {
            const fetched = await this.booru.search(this.tags, { limit: FEED_UPDATE_MAX_POST_COUNT });
            if(!fetched.length)
                return { success: true, posts: [], newPosts: [] };
            
            fetched.reverse();
            const lastFetchedAt = new Date(this.lastFetchedAt);
            const firstPost = fetched[0];
            const lastPost = fetched[fetched.length - 1];
            const mostRecentPost = firstPost.createdAt > lastPost.createdAt ? firstPost : lastPost;
            this.lastFetchedAt = mostRecentPost.createdAt;

            const newPosts = fetched.filter(post => post.createdAt > lastFetchedAt);

            return { success: true, posts: fetched, newPosts: newPosts };
        } catch(error) {
            console.log(chalk.redBright('Ocurrió un problema mientras se esperaban los resultados de búsqueda de un Feed'));
            console.log({
                guildName: this.channel.guild.name,
                channelId: this.channel.id,
                feedTags: this.tags,
            });
            console.error(error);

            return { success: false, posts: [], newPosts: [] };
        };
    }

    /**
     * @description Aumenta el número de fallas del Feed en pasos de 1.
     * @returns Una bulkOp de `updateOne` para un modelo {@linkcode GuildConfigs}, o `undefined` si ya se registraron 10 fallas.
     */
    addFault() {
        const channel = this.channel;
        const guild = channel.guild;

        auditAction('Comprobando eliminación de un Feed no disponible',
            { name: 'Servidor', value: `${guild}`, inline: true },
            { name: 'Canal', value: `${channel ?? 'No disponible'}`, inline: true },
            { name: 'Reintentos',  value: `${this.faults + 1} / 10`, inline: true },
        );

        if(this.faults >= 10)
            return undefined;

        this.faults += 1;
        return {
            updateOne: {
                filter: { guildId: guild.id },
                update: { $set: { [`feeds.${channel.id}.faults`]: this.faults } },
            },
        };
    }

    /**
     * @description Reduce progresivamente las fallas detectadas del Feed en pasos de 2.
     * @returns Una bulkOp de `updateOne` para un modelo {@linkcode GuildConfigs}.
     */
    reduceFaults() {
        const channel = this.channel;

        this.faults = Math.max(0, this.faults - 2);
        this.lastFetchedAt = new Date(Date.now());
        return {
            updateOne: {
                filter: { guildId: channel.guild.id },
                update: {
                    $set: {
                        [`feeds.${channel.id}.faults`]: this.faults,
                        [`feeds.${channel.id}.lastFetchedAt`]: this.lastFetchedAt,
                    }
                },
            },
        };
    }

    get allowNSFW() {
        if(this.channel.isThread())
            return this.channel.parent.nsfw;

        return this.channel.nsfw;
    }
}
