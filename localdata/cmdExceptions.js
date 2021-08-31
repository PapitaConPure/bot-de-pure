const global = require('../localdata/config.json');
const { MessageEmbed } = require('discord.js');

module.exports = {
    exceptions: {
        outdated: {
            title: 'Comando desactualizado',
            desc: 'El comando no se encuentra disponible debido a que su función ya no es requerida en absoluto. Espera a que se actualice~',
            isException: (message) => message.author.id !== global.peopleid.papita
        },

        maintenance: {
            title: 'Comando en mantenimiento',
            desc: 'El comando no se encuentra disponible debido a que está en proceso de actualización o reparación en este momento. Espera a que se actualice~',
            isException: (message) => message.author.id !== global.peopleid.papita
        },

        guide: {
            title: 'Símbolo de página de guía',
            desc: `Esto no es un comando, sino que una *página de guía* para buscarse con \`${global.p_pure}ayuda\``,
            isException: (_) => true
        },

        mod: {
            title: 'Comando exclusivo para moderación',
            desc: 'El comando es de uso restringido para moderación.\n**Considero a alguien como moderador cuando** tiene permisos para administrar roles *(MANAGE_ROLES)* o mensajes *(MANAGE_MESSAGES)*',
            isException: (message) => !(message.member.permissions.has('MANAGE_ROLES') || message.member.permissions.has('MANAGE_MESSAGES'))
        },

        papa: {
            title: 'Comando exclusivo de Papita con Puré',
            desc: 'El comando es de uso restringido para el usuario __Papita con Puré#6932__. Esto generalmente se debe a que el comando es usado para pruebas o ajustes globales/significativos/sensibles del Bot',
            isException: (message) => message.author.id !== global.peopleid.papita
        },

        hourai: {
            title: 'Comando exclusivo de Hourai Doll',
            desc: 'El comando es de uso restringido para el servidor __Hourai Doll__. Esto generalmente se debe a que cumple funciones que solo funcionan allí',
            isException: (message) => !(message.author.id === global.peopleid.papita || message.channel.guild.id === global.serverid.hourai)
        }
    },

    findExceptions(flag, message) {
        console.log(message.author.id, global.peopleid.papita);
        const exflag = module.exports.exceptions[flag];
        if(exflag && exflag.isException(message)) return exflag;
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