const { getQueueItem } = require('./localdata/models/queues.js');
const { randRange } = require('./func.js');
const { readFileSync } = require('fs');
const chalk = require('chalk');
const { ActivityType } = require('discord.js');
// const chalkOrange = chalk.rgb(255, 140, 70);

const txtToArray = (path) => readFileSync(path, { encoding: 'utf-8' })
    .split('\n')
    .map(t => { //Compatibilidad
        if(t.endsWith('\r')) return t.slice(0, -1);
        return t;
    })
    .filter(t => t.length);
const presence = {
    status: txtToArray('./localdata/presence/status.txt'),
    stream: txtToArray('./localdata/presence/stream.txt'),
};

const PRESENCE_TICK_INTERVAL_RANGE = [ 20, 35 ];

/**@satisfies {Record<`${number}-${number}`, (today: Date) => string>}*/
const specialDates = /**@type {const}*/({
    '01-01': _ => '¡Feliz año nuevo! 🎉',
    '02-14': _ => '¡Feliz día de San Valentín!',
    '04-01': _ => Math.random() < 0.5 ? '127.0.0.1' : '255.255.255.0',
    '04-22': _ => '¡Feliz día, Tierra!',
    '06-02': _ => '¡Feliz cumpleaños a mi creador!',
    '07-30': _ => '¡Feliz día de la amistad!',
    '09-13': _ => '¡Feliz día del programador!',
    '10-04': _ => '¡Feliz día de Tenshi! 🍑',
    '10-05': _ => '¿Feliz día de Tenshi?',
    '10-31': _ => 'Bú 👻 oOoOo 👻',
    '12-03': today => `¡Hoy cumplo ${today.getUTCFullYear() - 2019} años!`,
    '12-25': _ => '¡Feliz navidad!',
});

/**
 * Cambia la frase que muestra el usuario de Bot de Puré y reprograma dicha acción en un intervalo de tiempo predeterminado
 * 
 * Créditos a Imagine Breaker#6299 y Sassafras
 * @function Actualiza la actividad de Discord
 * @param {import('discord.js').Client} client
 * @param {Number} steps
 */
async function modifyPresence(client, steps = 0) {
    try {
        const now = new Date(Date.now());
        const dayKey = `${now.getUTCDate()}`.padStart(2, '0');
        const monthKey = `${now.getUTCMonth() + 1}`.padStart(2, '0');
        const specialDateKey = `${monthKey}-${dayKey}`;

        const status = specialDates[specialDateKey]?.(now) ?? presence.status[await getQueueItem({
            queueId: 'presenceStatus',
            length: presence.status.length,
            sort: 'RANDOM',
        })];

        client.user.setActivity({
            type: ActivityType.Custom,
            name: 'customstatus',
            state: `🥔 ${status}`,
        });
    } catch(err) {
        console.log(chalk.redBright.bold('Ocurrió un error al intentar realizar un cambio de presencia.'));
        console.error(err);
    } finally {
        //Programar próxima actualización de actividad
        const [ minInterval, maxInterval ] = PRESENCE_TICK_INTERVAL_RANGE;
        const stepTime = randRange(minInterval, maxInterval);
        setTimeout(module.exports.modifyPresence, 60e3 * stepTime, client, steps + 1);
    }
}

///Iniciar actualización periódica de presencia al estar preparado
module.exports = {
    modifyPresence,
};