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
        const thisDay = now.getUTCDate();
        const thisMonth = now.getUTCMonth();
        //const thisYear = now.getUTCFullYear();

        let status;
        if(thisMonth === 12 && thisDay === 25)
            status = '¡Feliz navidad!';
        else {
            status = presence.status[await getQueueItem({
                queueId: 'presenceStatus',
                length: presence.status.length,
                sort: 'RANDOM',
            })];
        }

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