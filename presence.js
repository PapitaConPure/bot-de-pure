const { getQueueItem } = require('./localdata/models/queues.js');
const { randRange } = require('./func.js');
const { readFileSync } = require('fs');
const chalk = require('chalk');
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
    statusSpecial: txtToArray('./localdata/presence/statusSpecial.txt'),
};

///Iniciar actualización periódica de presencia al estar preparado
module.exports = {
    /**
     * @function Actualiza la actividad de Discord
     * @param {import('discord.js').Client} client
     * @param {Number} steps
     * @returns
     */
    modifyPresence: async function(client, steps = 0) { //Cambio de estado constante; Créditos a Imagine Breaker#6299 y Sassafras
        //Actualización de actividad
        try {
            const status = presence.status[await getQueueItem({ queueId: 'presenceStatus', length: presence.status.length, sort: 'RANDOM' })];
            const stream = presence.stream[await getQueueItem({ queueId: 'presenceStream', length: presence.stream.length, sort: 'RANDOM' })];

            client.user.setActivity({
                name: status,
                type: 'STREAMING',
                url: `https://www.youtube.com/watch?v=${stream}`,
            });
            
            //Programar próxima actualización de actividad
            const stepTime = randRange(20, 35);
            setTimeout(module.exports.modifyPresence, 60e3 * stepTime, client, steps + 1);
            // console.log(chalkOrange(`Cambio de presencia ${steps} realizado. Próximo ciclo en ${stepTime} minutos...`));
        } catch(err) {
            console.log(chalk.redBright.bold('Ocurrió un error al intentar realizar un cambio de presencia.'));
            console.error(err);
        }
    },
};