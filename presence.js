const Queue = require('./localdata/models/queues.js');
const { randRange } = require('./func.js');
const { readFileSync } = require('fs');
const chalk = require('chalk');
const chalkOrange = chalk.rgb(255, 140, 70);

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

const statusQuery = { queueId: 'presenceStatus' };
const streamQuery = { queueId: 'presenceStream' };

const generateQueue = (length) => {
    if(length <= 0) return [];
    
    const mapByIndex = (_, i) => i;
    const shuffleFn = () => Math.random() - 0.5;
    return Array
        .from({ length }, mapByIndex)
        .sort(shuffleFn);
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
            const statusQueue = (await Queue.findOne(statusQuery)) || new Queue(statusQuery);
            const streamQueue = (await Queue.findOne(streamQuery)) || new Queue(streamQuery);
            if(!statusQueue.content?.length) statusQueue.content = generateQueue(presence.status.length);
            if(!streamQueue.content?.length) streamQueue.content = generateQueue(presence.stream.length);

            const status = presence.status[statusQueue.content.shift()];
            const stream = presence.stream[streamQueue.content.shift()];

            statusQueue.markModified('content');
            streamQueue.markModified('content');
            await Promise.all([
                statusQueue.save(),
                streamQueue.save(),
            ]);

            client.user.setActivity({
                name: status,
                type: 'STREAMING',
                url: `https://www.youtube.com/watch?v=${stream}`,
            });
            
            //Programar próxima actualización de actividad
            const stepwait = randRange(20, 35);
            setTimeout(module.exports.modifyPresence, 60e3 * stepwait, client, steps + 1);
            console.log(chalkOrange(`Cambio de presencia ${steps} realizado. Próximo ciclo en ${stepwait} minutos...`));
        } catch(err) {
            console.log(chalk.redBright.bold('Ocurrió un error al intentar realizar un cambio de presencia.'));
            console.error(err);
        }
    },
};