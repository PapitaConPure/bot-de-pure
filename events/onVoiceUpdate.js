const { PureVoiceUpdateHandler } = require('../systems/purevoice.js');
const chalk = require('chalk');

/**@type {{ [x: string]: Promise<*>}}*/
let availability = {};
/**
 * 
 * @param {import('discord.js').VoiceState} oldState 
 * @param {import('discord.js').VoiceState} state 
 */
async function onVoiceUpdate(oldState, state) {
    const guildId = state.guild.id;
    if(availability[guildId]) await availability[guildId];
    availability[guildId] = new Promise(async resolve => {
        const pv = new PureVoiceUpdateHandler(oldState, state);
        await pv.getSystemDocument({ guildId: state.guild.id }).catch(console.error);
        if(!pv.systemIsInstalled()) return resolve();

        try {
            await Promise.all([
                pv.checkFaultySessions(),
                pv.handleDisconnection(),
                pv.handleConnection(),
            ])
            await pv.saveChanges();
        } catch(error) {
            console.log(chalk.redBright('Ocurrió un error mientras se analizaba un cambio de estado en una sesión Purévoice'));
            console.error(error);
        }

        resolve();
    });
}

module.exports = {
    onVoiceUpdate,
}