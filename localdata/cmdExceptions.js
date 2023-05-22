const global = require('../localdata/config.json');
const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('./models/guildconfigs.js');
const { isNotModerator } = require('../func');
const chalk = require('chalk');
const { auditError } = require('../systems/auditor.js');
const { CommandMetaFlagsManager } = require('../commands/Commons/cmdFlags');

const isNotByPapita = (compare) => (compare.member.user.id !== global.peopleid.papita);

/**
 * @typedef {{flag: import('../commands/Commons/cmdFlags').MetaFlagValue, title: String, desc: String, isException: Function?}} ExceptionSummary
 */

module.exports = {
    /**@type {Array<ExceptionSummary>}*/
    exceptions: [
        {
            flag: 'OUTDATED',
            title: 'Comando desactualizado',
            desc: 'El comando no se encuentra disponible debido a que su función ya no es requerida en absoluto. Espera a que se actualice~',
            isException: (compare) => isNotByPapita(compare)
        },
        {
            flag: 'MAINTENANCE',
            title: 'Comando en mantenimiento',
            desc: 'El comando no se encuentra disponible debido a que está en proceso de actualización o reparación en este momento. Espera a que se actualice~',
            isException: (compare) => isNotByPapita(compare)
        },
        {
            flag: 'MOD',
            title: 'Comando exclusivo para moderación',
            desc: 'El comando es de uso restringido para moderación.\n**Considero a alguien como moderador cuando** tiene permisos para administrar roles *(MANAGE_ROLES)* o mensajes *(MANAGE_MESSAGES)*',
            isException: (compare) => isNotModerator(compare.member)
        },
        {
            flag: 'CHAOS',
            title: 'Los Comandos Caóticos están desactivados',
            desc: 'Este comando se considera un Comando Caótico debido a su volatilidad y tendencia a corromper la paz. Los comandos caóticos están desactivados por defecto. Refiérete al comando "caos" para ver cómo activarlos',
            isException: async (compare) => {
                const gcfg = (await GuildConfig.findOne({ guildId: compare.guild.id })) || new GuildConfig({ guildId: compare.guild.id });
                return isNotByPapita(compare) && !gcfg.chaos;
            }
        },
        {
            flag: 'GUIDE',
            title: 'Símbolo de página de guía',
            desc: 'Esto no es un comando, sino que una *página de guía* para buscarse con el comando de ayuda',
            isException: (_) => true
        },
        {
            flag: 'PAPA',
            title: 'Comando exclusivo de Papita con Puré',
            desc: 'El comando es de uso restringido para el usuario __Papita con Puré#6932__. Esto generalmente se debe a que el comando es usado para pruebas o ajustes globales/significativos/sensibles del Bot',
            isException: (compare) => isNotByPapita(compare)
        },
        {
            flag: 'HOURAI',
            title: 'Comando exclusivo de Saki Scans',
            desc: 'El comando es de uso restringido para el servidor __Saki Scans (Hourai Doll)__. Esto generalmente se debe a que cumple funciones que solo funcionan allí',
            isException: (compare) => isNotByPapita(compare) && compare.guild.id !== global.serverid.saki
        },
    ],

    /**
     * 
     * @param {CommandMetaFlagsManager} flags 
     * @param {import('../commands/Commons/typings').CommandRequest} request 
     * @returns {Promise<ExceptionSummary?>}
     */
    async findFirstException(flags, request) {
        if(!flags) return null;

        const possibleExceptions = await Promise.all(
            module.exports.exceptions
                .map(exception => flags.has(exception.flag) && exception.isException(request))
        );
        const exceptions = module.exports.exceptions.filter((_, i) => possibleExceptions[i]);

        return exceptions?.[0];
    },

    /**
     * @typedef {{cmdString: String}} ExceptionOptions
     * @param {ExceptionSummary} exception 
     * @param {ExceptionOptions} options 
     * @returns {EmbedBuilder}
     */
    generateExceptionEmbed(exception, { cmdString = '' }) {
        return new EmbedBuilder()
            .setColor(0xf01010)
            .setAuthor({ name: 'Un momento...' })
            .setTitle(`${exception.title}`)
            .addFields({ name: cmdString, value: `${exception.desc}` })
            .setThumbnail('https://i.imgur.com/vZaDu1o.jpg')
            .setFooter({ text: '¿Dudas? ¿Sugerencias? Contacta con Papita con Puré#6932' });
    },

    /**
     * 
     * @param {Error} error 
     * @param {import('../commands/Commons/typings').CommandRequest} request
     * @typedef {{ brief: string, details: string }} errorLogOptions
     * @param {errorLogOptions} param2 
     * @returns {Boolean} Devuelve si el error se debe a una falta de permisos
     */
    async handleAndAuditError(error, request, { brief, details }) {
        if(error.message === 'Missing Permissions') {
            /**@type {import('discord.js').User}*/
            const user = request.author ?? request.user;
            const permsEmbed = new EmbedBuilder()
                .setColor(0x0000ff)
                .setAuthor({ name: `${request.guild.name} • ${request.channel.name} (Click para ver)`, iconURL: user.avatarURL({ size: 128 }), url: request.url || 'https://discordapp.com' })
                .setThumbnail('https://i.imgur.com/ftAxUen.jpg')
                .addFields(
                    {
                        name: '¡Me faltan permisos!',
                        value: [
                            'No tengo los permisos necesarios para ejecutar el comando o acción que acabas de pedirme en ese canal',
                            'Soy una niña educada, así que no haré nada hasta que me den permiso. Puedes comentarle el asunto a algún moderador del server para que lo revise',
                        ].join('\n'),
                    },
                    {
                        name: 'Reportar un error',
                        value: `¿Crees que esto se trata de otro problema? Eso nunca debería ser el caso, pero de ser así, puedes [reportarlo](${global.reportFormUrl})`,
                    },
                );

            user.send({ embeds: [permsEmbed] }).catch(console.error);
            return true;
        }
        
        //Los mensajes no tienen una propiedad de "token", las interacciones sí
        if(!brief) {
            if(!request.token)                  brief = 'Ha ocurrido un error al ejecutar un comando';
            else if(request.isCommand())        brief = 'Ha ocurrido un error al procesar un comando Slash';
            else if(request.isButton())         brief = 'Ha ocurrido un error al procesar una acción de botón';
            else if(request.isSelectMenu())     brief = 'Ha ocurrido un error al procesar una acción de menú desplegable';
            else if(request.isModalSubmit())    brief = 'Ha ocurrido un error al procesar una acción de ventana modal';
            else                                brief = 'Ha ocurrido un error desconocido';
        }

        console.log(chalk.bold.redBright(brief));
        console.error(error);
        auditError(error, { request, brief, details, ping: true });
        return false;
    }
}