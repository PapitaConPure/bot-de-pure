const presence = require('./localdata/presence.json'); //Datos de presencia
const { randInArray, randRange } = require('./func');
const chalk = require('chalk');
const chalkOrange = chalk.rgb(255, 140, 70);

///Iniciar actualización periódica de presencia al estar preparado
module.exports = {
    /**
     * @function Actualiza la actividad de Discord
     * @param {import('discord.js').Client} client
     * @param {Number} steps
     * @returns
     */
    modifyPresence: function(client, steps = 0) { //Cambio de estado constante; Créditos a Imagine Breaker#6299 y Sassafras
        //Actualización de actividad
        try {
            client.user.setActivity({
                name: randInArray(presence.status),
                type: 'STREAMING',
                url: `https://www.youtube.com/watch?v=${randInArray(presence.stream)}`,
            });
            
            //Programar próxima actualización de actividad
            const stepwait = randRange(30, 70);
            setTimeout(module.exports.modifyPresence, 60e3 * stepwait, client, steps + 1);
            console.log(chalkOrange(`Cambio de presencia ${steps} realizado. Próximo ciclo en ${stepwait} minutos...`));
        } catch(err) {
            console.log(chalk.redBright.bold('Ocurrió un error al intentar realizar un cambio de presencia.'));
            console.error(err);
        }
    },
};