const userIds = require('../data/userIds.json');
const serverIds = require('../data/serverIds.json');
const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildconfigs.js');
const { isNotModerator } = require('../func');
const chalk = require('chalk');
const { auditError } = require('../systems/others/auditor');
const { Command } = require('../commands/Commons/cmdBuilder.js');
const { reportFormUrl } = require('../data/globalProps');

/**
 * @typedef {(request: import('../commands/Commons/typings').CommandRequest) => Promise<Boolean>} ExceptionTestFn
 */
/**
 * @typedef {Object} ExceptionSummary
 * @property {import('../commands/Commons/cmdTags').CommandTagResolvable} tag
 * @property {String} title
 * @property {String} desc
 * @property {ExceptionTestFn} isException
 */

/**@type {ExceptionTestFn}*/
const isNotByPapita = async request => (request.member.user.id !== userIds.papita);

module.exports = {
    /**@type {Array<ExceptionSummary>}*/
    exceptions: [
        {
            tag: 'OUTDATED',
            title: 'Comando desactualizado',
            desc: 'El comando no se encuentra disponible debido a que su función ya no es requerida en absoluto o su mantención no se encontró justificada',
            isException: async request => isNotByPapita(request),
        },
        {
            tag: 'MAINTENANCE',
            title: 'Comando en mantenimiento',
            desc: 'El comando no se encuentra disponible debido a que está en proceso de actualización o reparación en este momento. Espera a que se actualice~',
            isException: async request => isNotByPapita(request),
        },
        {
            tag: 'MOD',
            title: 'Comando exclusivo para moderación',
            desc: 'El comando es de uso restringido para moderación.\n**Considero a alguien como moderador cuando** tiene permisos para administrar roles *(MANAGE_ROLES)* o mensajes *(MANAGE_MESSAGES)*\nNota: esto cambiará en una futura actualización, o puede ya haber cambiado pero no se ha actualizado este mensaje de error',
            isException: async request => isNotModerator(request.member),
        },
        {
            tag: 'CHAOS',
            title: 'Los Comandos Caóticos están desactivados',
            desc: 'Este comando se considera un Comando Caótico debido a su volatilidad y tendencia a corromper la paz. Los comandos caóticos están desactivados por defecto. Refiérete al comando "caos" para ver cómo activarlos',
            isException: async request => {
                const gcfg = (await GuildConfig.findOne({ guildId: request.guild.id })) || new GuildConfig({ guildId: request.guild.id });
                return isNotByPapita(request) && !gcfg.chaos;
            },
        },
        {
            tag: 'GUIDE',
            title: 'Símbolo de página de guía',
            desc: 'Esto no es un comando, sino que una *página de guía* para buscarse con el comando de ayuda (`p!ayuda <guía>`)',
            isException: async () => true,
        },
        {
            tag: 'PAPA',
            title: 'Comando exclusivo de Papita con Puré',
            desc: 'El comando es de uso restringido para el usuario __Papita con Puré#6932__. Esto generalmente se debe a que el comando es usado para pruebas o ajustes globales/significativos/sensibles del Bot',
            isException: async request => isNotByPapita(request),
        },
        {
            tag: 'SAKI',
            title: 'Comando exclusivo de Saki Scans',
            desc: [
                'El comando es de uso restringido para el servidor __Saki Scans (anteriormente Hourai Doll)__.',
                'Esto generalmente se debe a que cumple funciones que solo funcionan allí o que solo tiene sentido que se mantengan en dicho lugar',
                'Si te interesa, puedes [unirte al servidor](https://discord.gg/pPwP2UNvAC)',
            ].join('\n'),
            isException: async request => isNotByPapita(request) && request.guild.id !== serverIds.saki,
        },
    ],

    /**
     * 
     * @param {Command} command
     * @param {import('../commands/Commons/typings').CommandRequest} request 
     * @returns {Promise<ExceptionSummary?>}
     */
    async findFirstException(command, request) {
        const flags = command.flags;
        if(!flags) return null;

        const possibleExceptions = await Promise.all(
            module.exports.exceptions
                .map(exception => flags.has(exception.tag) && exception.isException(request))
        );
        const exceptions = module.exports.exceptions.filter((_, i) => possibleExceptions[i]);

        return exceptions?.[0];
    },

    /**
     * @typedef {{cmdString: String}} ExceptionOptions
     * @param {Omit<ExceptionSummary, 'tag' | 'isException'>} exception 
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
     * @typedef {Object} ErrorLogOptions
     * @property {String} [brief]
     * @property {String} [details]
     */
    /**
     * 
     * @param {Error} error 
     * @param {import('../commands/Commons/typings').CommandRequest | import('discord.js').Interaction<import('discord.js').CacheType>} request
     * @param {ErrorLogOptions} logOptions 
     * @returns {Promise<Boolean>} Devuelve si el error se debe a una falta de permisos
     */
    async handleAndAuditError(error, request, logOptions = {}) {
        if(error.message === 'Missing Permissions') {
            /**@type {import('discord.js').User}*/
            const user = 'author' in request ? request.author : request.user;
            const permsEmbed = new EmbedBuilder()
                .setColor(0x0000ff)
                .setAuthor({ name: `${request.guild.name} • ${request.channel.name} (Click para ver)`, iconURL: user.avatarURL({ size: 128 }), url: 'url' in request ? request.url : 'https://discordapp.com' })
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
                        value: `¿Crees que esto se trata de otro problema? Eso nunca debería ser el caso, pero de ser así, puedes [reportarlo](${reportFormUrl})`,
                    },
                );

            user.send({ embeds: [permsEmbed] }).catch(console.error);
            return true;
        }
        
        let { brief, details } = logOptions;
        if(!brief) {
            if(Command.requestIsMessage(request)) brief = 'Ha ocurrido un error al ejecutar un comando';
            else if(request.isCommand())                 brief = 'Ha ocurrido un error al procesar un comando Slash';
            else if(request.isButton())                  brief = 'Ha ocurrido un error al procesar una acción de botón';
            else if(request.isStringSelectMenu())        brief = 'Ha ocurrido un error al procesar una acción de menú desplegable';
            else if(request.isModalSubmit())             brief = 'Ha ocurrido un error al procesar una acción de ventana modal';
            else                                         brief = 'Ha ocurrido un error desconocido';
        }

        console.log(chalk.bold.redBright(brief));
        console.error(error);
        auditError(error, { request, brief, details, ping: true });
        return false;
    }
}