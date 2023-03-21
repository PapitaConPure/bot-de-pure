const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');

const { connect } = require('mongoose');
const PrefixPair = require('../localdata/models/prefixpair.js');
const UserConfigs = require('../localdata/models/userconfigs.js');
const { Puretable, defaultEmote } = require('../localdata/models/puretable.js');
const HouraiDB = require('../localdata/models/hourai.js');

const envPath = '../localenv.json';
// const envPath = '../remoteenv.json';
const mongoUri = process.env.MONGODB_URI ?? (require(envPath)?.dburi);

const globalConfigs = require('../localdata/config.json');
const { setupGuildFeedUpdateStack, feedTagSuscriptionsCache } = require('../systems/boorufeed');
const { modifyPresence } = require('../presence.js');
const { auditSystem } = require('../systems/auditor.js');

//Funcionalidad adicional
const { registerFont, loadImage } = require('canvas');
const { lookupService } = require('dns');
const { promisify } = require('util');
const chalk = require('chalk');
//#endregion

async function startup(client, discordToken, logOptions) {
    const confirm = () => console.log(chalk.green('Hecho.'));
    globalConfigs.maintenance = '1';

    try {
        console.log(chalk.bold.magentaBright('Cargando comandos slash...'));
        const restGlobal = new REST({ version: '9' }).setToken(discordToken);
        await restGlobal.put(
            Routes.applicationCommands(client.application.id),
            { body: client.SlashPure },
        );
        logOptions.slash && console.log('Comandos registrados (global):', registeredGlobal.map(scmd => scmd.name));
        const dedicatedServerId = (process.env.I_LOVE_MEGUMIN) ? globalConfigs.serverid.hourai : globalConfigs.serverid.slot1;
        await restGlobal.put(
            Routes.applicationGuildCommands(client.application.id, dedicatedServerId),
            { body: client.SlashHouraiPure },
        );
        logOptions.slash && console.log('Comandos registrados (hourai):', registeredHourai.map(scmd => scmd.name));
        confirm();
    } catch (error) {
        console.log(chalk.bold.redBright('Ocurrió un error al intentar cargar los comandos slash'));
        console.error(error);
    }

	console.log(chalk.cyan('Semilla y horario calculados'));
    let currentTime = Date.now();
    globalConfigs.startupTime = currentTime;
    globalConfigs.lechitauses = currentTime;
    globalConfigs.seed = currentTime / 60000;

	console.log(chalk.magenta('Obteniendo información del host...'));
    try {
        const asyncLookupService = promisify(lookupService);
        const host = await asyncLookupService('127.0.0.1', 443);
        globalConfigs.bot_status.host = `${host.service}://${host.hostname}/`;
        confirm();
    } catch(err) {
        globalConfigs.bot_status.host = 'Desconocido';
        console.log(chalk.red('Fallido.'));
        console.error(err);
    }

    console.log(chalk.magenta('Indexando Slots de Puré...'));
    (await Promise.all([
        client.guilds.fetch(globalConfigs.serverid.slot1),
        client.guilds.fetch(globalConfigs.serverid.slot2),
        client.guilds.fetch(globalConfigs.serverid.slot3),
    ])).forEach((guild, i) => { globalConfigs.slots[`slot${i + 1}`] = guild; });
    globalConfigs.logch = await globalConfigs.slots.slot1.channels.resolve('870347940181471242');
    confirm();
    
    //Cargado de datos de base de datos
    console.log(chalk.yellowBright.italic('Cargando datos de base de datos...'));
    console.log(chalk.gray('Conectando a Cluster en la nube...'));
    await connect(mongoUri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
    console.log(chalk.gray('Facilitando prefijos'));
    const [ prefixPairs, userConfigs ] = await Promise.all([
        PrefixPair.find({}),
        UserConfigs.find({}),
    ]);
    prefixPairs.forEach(pp => {
        globalConfigs.p_pure[pp.guildId] = {
            raw: pp.pure.raw,
            regex: pp.pure.regex,
        };
        globalConfigs.p_drmk[pp.guildId] = {
            raw: pp.drmk.raw,
            regex: pp.drmk.regex,
        };
    });
    logOptions.prefixes && console.table(globalConfigs.p_pure);

    console.log(chalk.gray('Preparando Suscripciones de Feeds...'));
    userConfigs.map(config => {
        /**@type {Map<String, Array<String>>}*/
        const suscriptions = new Map();
        for(const [ chId, tags ] of config.feedTagSuscriptions)
            suscriptions.set(chId, tags);
        feedTagSuscriptionsCache.set(config.userId, suscriptions);
    });
    logOptions.feedSuscriptions && console.log({ feedTagSuscriptionsCache });

    console.log(chalk.gray('Preparando Infracciones de Hourai...'));
    const hourai = (await HouraiDB.findOne({})) || new HouraiDB({});
    {
        const now = Date.now();
        let wasModified = false;
        Object.entries(hourai.userInfractions).forEach(([userId, infractions]) => {
            const previousInfractionsLength = infractions.length;
            infractions = infractions.filter(inf => (now - inf) < (60e3 * 60 * 4)); //Eliminar antiguas
            //console.log(`${userId}:`, infractions);

            if(previousInfractionsLength === infractions.length) return;
            wasModified = true;

            if(!infractions.length) {
                hourai.userInfractions[userId] = null;
                delete hourai.userInfractions[userId];
                return;
            }
            
            globalConfigs.hourai.infr.users[userId] = infractions;
            hourai.userInfractions[userId] = infractions;
        });
        if(wasModified) hourai.markModified('userInfractions');
    }
    await hourai.save();

    console.log(chalk.gray('Preparando Tabla de Puré...'));
    const pureTableDocument = await Puretable.findOne({});
    let puretable = pureTableDocument;
    if(!puretable) puretable = new Puretable();
    else //Limpiar emotes eliminados / no accesibles
        puretable.cells = puretable.cells.map(arr =>
            arr.map(cell => client.emojis.cache.get(cell) ? cell : defaultEmote )
        );
    const uniqueEmoteIds = new Set();
    const pendingEmoteCells = [];
    puretable.cells.flat().forEach(cell => uniqueEmoteIds.add(cell));
    
    /**@param {String} id*/
    async function getEmoteCell(id) {
        const image = await loadImage(client.emojis.cache.get(id).url);
        return { id, image };
    }

    for(const id of uniqueEmoteIds)
        pendingEmoteCells.push(getEmoteCell(id));
    const [ _, pureTableImage, emoteCells ] = await Promise.all([
        puretable.save(),
        loadImage('https://i.imgur.com/TIL0jPV.png'),
        Promise.all(pendingEmoteCells),
    ]);
    globalConfigs.pureTableImage = pureTableImage;
    globalConfigs.loademotes = {};
    for(const cell of emoteCells)
        globalConfigs.loademotes[cell.id] = cell.image;
    
    console.log(chalk.gray('Preparando imágenes extra...'));
    const slot3Emojis = globalConfigs.slots.slot3.emojis.cache;
    const [ WHITE, BLACK, pawn ] = await Promise.all([
        loadImage(slot3Emojis.find(e => e.name === 'wCell').url),
        loadImage(slot3Emojis.find(e => e.name === 'bCell').url),
        loadImage(slot3Emojis.find(e => e.name === 'pawn').url),
    ]);
    globalConfigs.loademotes['chess'] = { WHITE, BLACK, pawn };
    
    console.log(chalk.gray('Iniciando cambios de presencia periódicos'));
    modifyPresence(client);
    confirm();

	console.log(chalk.rgb(158,114,214)('Registrando fuentes'));
    registerFont('fonts/Alice-Regular.ttf',             { family: 'headline' });
    registerFont('fonts/cuyabra.otf',                   { family: 'cuyabra' });
    registerFont('fonts/teen bd.ttf',                   { family: 'cardname' });
    registerFont('fonts/kirsty rg.otf',                 { family: 'cardclass' });
    registerFont('fonts/asap-condensed.semibold.ttf',   { family: 'cardbody' });
    registerFont('fonts/BebasNeue_1.otf',               { family: 'bebas' });
    registerFont('fonts/DINPro-Cond.otf',               { family: 'dinpro' });

    globalConfigs.maintenance = '';
	console.log(chalk.greenBright.bold('Bot conectado y funcionando'));
    const { bot_status } = globalConfigs;
    auditSystem('Bot conectado y funcionando', 
        { name: 'Host',             value: bot_status.host,                             inline: true },
        { name: 'N. de versión',    value: bot_status.version.number,                   inline: true },
        { name: 'Fecha',            value: `<t:${Math.floor(Date.now() / 1000)}:f>`,    inline: true },
    );

    await setupGuildFeedUpdateStack(client);
}

module.exports = {
    startup,
}