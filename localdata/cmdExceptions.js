const global = require('../localdata/config.json');
const { MessageEmbed } = require('discord.js');
const GuildConfig = require('./models/guildconfigs.js');

const isNotByPapita = (compare) => (compare.member.user.id !== global.peopleid.papita);

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
            isException: (compare) => !(compare.member.permissions.has('MANAGE_ROLES') || compare.member.permissions.has('MANAGE_MESSAGES'))
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

    async findExceptions(flag, compare) {
        const exflag = module.exports.exceptions[flag];
        if(exflag && await exflag.isException(compare)) return exflag;
        else return null;
    },

    createEmbed(exception, { cmdString = '' }) {
        return new MessageEmbed()
            .setColor('#f01010')
            .setAuthor('Un momento...')
            .setTitle(`${exception.title}`)
            .addField(cmdString, `${exception.desc}`)
            .setFooter('¿Dudas? ¿Sugerencias? Contacta con Papita con Puré#6932');
    }
}