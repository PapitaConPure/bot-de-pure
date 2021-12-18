const global = require('../localdata/config.json');
const { MessageEmbed } = require('discord.js');
const GuildConfig = require('./models/guildconfigs.js');
const { isNotModerator } = require('../func');

const isNotByPapita = (compare) => (compare.member.user.id !== global.peopleid.papita);

/**
 * @typedef {{title: String, desc: String, isException: Function?}} ExceptionSummary
 */

module.exports = {
    exceptions: {
        outdated: {
            title: 'Comando desactualizado',
            desc: 'El comando no se encuentra disponible debido a que su función ya no es requerida en absoluto. Espera a que se actualice~',
            isException: (compare) => isNotByPapita(compare)
        },

        maintenance: {
            title: 'Comando en mantenimiento',
            desc: 'El comando no se encuentra disponible debido a que está en proceso de actualización o reparación en este momento. Espera a que se actualice~',
            isException: (compare) => isNotByPapita(compare)
        },

        mod: {
            title: 'Comando exclusivo para moderación',
            desc: 'El comando es de uso restringido para moderación.\n**Considero a alguien como moderador cuando** tiene permisos para administrar roles *(MANAGE_ROLES)* o mensajes *(MANAGE_MESSAGES)*',
            isException: (compare) => isNotModerator(compare.member)
        },

        chaos: {
            title: 'Los Comandos Caóticos están desactivados',
            desc: 'Este comando se considera un Comando Caótico debido a su volatilidad y tendencia a corromper la paz. Los comandos caóticos están desactivados por defecto. Refiérete al comando "caos" para ver cómo activarlos',
            isException: async (compare) => {
                const gcfg = (await GuildConfig.findOne({ guildId: compare.guild.id })) || new GuildConfig({ guildId: compare.guild.id });
                return isNotByPapita(compare) && !gcfg.chaos;
            }
        },

        guide: {
            title: 'Símbolo de página de guía',
            desc: 'Esto no es un comando, sino que una *página de guía* para buscarse con el comando de ayuda',
            isException: (_) => true
        },

        papa: {
            title: 'Comando exclusivo de Papita con Puré',
            desc: 'El comando es de uso restringido para el usuario __Papita con Puré#6932__. Esto generalmente se debe a que el comando es usado para pruebas o ajustes globales/significativos/sensibles del Bot',
            isException: (compare) => isNotByPapita(compare)
        },

        hourai: {
            title: 'Comando exclusivo de Hourai Doll',
            desc: 'El comando es de uso restringido para el servidor __Hourai Doll__. Esto generalmente se debe a que cumple funciones que solo funcionan allí',
            isException: (compare) => isNotByPapita(compare) && compare.guild.id !== global.serverid.hourai
        }
    },

    /**
     * 
     * @param {String} flag 
     * @param {import('../commands/Commons/typings').CommandRequest} compare 
     * @returns {Promise<ExceptionSummary> | Promise<null>}
     */
    async getException(flag, compare) {
        const exflag = module.exports.exceptions[flag];
        if(exflag && await exflag.isException(compare)) return exflag;
        else return null;
    },

    /**
     * 
     * @param {Array<String>} flags 
     * @param {import('../commands/Commons/typings').CommandRequest} request 
     * @returns {Promise<ExceptionSummary> | Promise<undefined>}
     */
    async findFirstException(flags, request) {
        const exceptions = [];
        flags.forEach(flag => {
            const ex = module.exports.getException(flag, request);
            if(ex) exceptions.push(ex);
        });
        return (await Promise.all(exceptions)).find(flag => flag);
    },

    /**
     * @typedef {{cmdString: String}} ExceptionOptions
     * @param {ExceptionSummary} exception 
     * @param {ExceptionOptions} options 
     * @returns {MessageEmbed}
     */
    createEmbed(exception, { cmdString = '' }) {
        return new MessageEmbed()
            .setColor('#f01010')
            .setAuthor('Un momento...')
            .setTitle(`${exception.title}`)
            .addField(cmdString, `${exception.desc}`)
            .setThumbnail('https://i.imgur.com/vZaDu1o.jpg')
            .setFooter('¿Dudas? ¿Sugerencias? Contacta con Papita con Puré#6932');
    }
}