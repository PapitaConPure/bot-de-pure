const global = require('../localdata/config.json');
const { MessageEmbed } = require('discord.js');
const GuildConfig = require('./models/guildconfigs.js');
const { isNotModerator } = require('../func');
const chalk = require('chalk');

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
            .setAuthor({ name: 'Un momento...' })
            .setTitle(`${exception.title}`)
            .addField(cmdString, `${exception.desc}`)
            .setThumbnail('https://i.imgur.com/vZaDu1o.jpg')
            .setFooter({ text: '¿Dudas? ¿Sugerencias? Contacta con Papita con Puré#6932' });
    },

    /**
     * 
     * @param {Error} error 
     * @param {import('discord.js').TextChannel} logChannel 
     * @param {import('../commands/Commons/typings').CommandRequest} request
     * @param {{ details: string }} options 
     * @returns {Boolean} Devuelve si el error se debe a una falta de permisos
     */
    async handleAndLogError(error, request, options) {
        /**@type {import('discord.js').User}*/
        const user = request.author ?? request.user;

        const errorEmbed = new MessageEmbed()
            .setColor('#0000ff')
            .setAuthor({ name: `${request.guild.name} • ${request.channel.name} (Click para ver)`, iconURL: user.avatarURL({ dynamic: true }), url: request.url || 'https://discordapp.com' });
        
        if(error.message === 'Missing Permissions') {
            errorEmbed
                .setThumbnail('https://i.imgur.com/ftAxUen.jpg')
                .addField('¡Me faltan permisos!', [
                    'No tengo los permisos necesarios para ejecutar el comando o acción que acabas de pedirme en ese canal',
                    'Soy una niña educada, así que no haré nada hasta que me den permiso. Puedes comentarle el asunto a algún moderador del server para que lo revise',
                ].join('\n'))
                .addField('Reportar un error', `¿Crees que esto se trata de otro problema? Eso nunca debería ser el caso, pero de ser así, puedes [reportarlo](${global.reportFormUrl})`);

            user.send({ embeds: [errorEmbed] }).catch(console.error);
            return true;
        }
        
        //Los mensajes no tienen una propiedad de "token", las interacciones sí
        let brief;
        if(!request.token)                                      brief = 'Ha ocurrido un error al ejecutar un comando';
        else if(request.isCommand())                            brief = 'Ha ocurrido un error al procesar un comando Slash';
        else if(request.isButton() || request.isSelectMenu())   brief = 'Ha ocurrido un error al procesar una acción de botón';
        else if(request.isModalSubmit())                        brief = 'Ha ocurrido un error al procesar una acción modal';

        console.log(chalk.bold.redBright(brief));
        console.error(error);

        errorEmbed.addField('Ha ocurrido un error al ejecutar una acción', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
        if(options.details)
            errorEmbed.addField('Detalle', options.details);
        
        global.logch.send({
            content: `<@${global.peopleid.papita}>`,
            embeds: [errorEmbed],
        }).catch(console.error);
        return false;
    }
}