const { auditError } = require('../../systems/auditor');
const global = require('../config.json');
const Hourai = require('../models/hourai.js');
const guildIds = global.serverid;

/**@param {import('discord.js').Message} message*/
function fuckEveryOtherBot(message) {
    const { channel, author } = message;
    if(author.id === message.client.user.id) return;
    const content = message.content.toLowerCase();
    const hrai = content.indexOf('hourai');
    const reps = global.hourai.replies;
    const { prefix: hraipf, suffix: hraisf } = reps.ignore;
    const hraifound = hrai !== -1 && !(hraipf.some(pf => content.indexOf(`${pf}hourai`) === (hrai - pf.length)) || hraisf.some(sf => content.indexOf(`hourai${sf}`) === hrai));
    if(hraifound && author.id !== global.peopleid.bern) {
        const fuckustr = (content.indexOf('puré') !== -1 || content.indexOf('pure') !== -1) ? reps.compare : reps.taunt;
        channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)]});
        //message.channel.send({ content: 'Descanse en paz, mi pana <:pensaki:852779998351458344>' });
    } else if(content.startsWith('~echo ') || content.startsWith('$say '))
        setTimeout(responder, 800, () => {
            const fuckustr = reps.reply;
            channel.send({ content: fuckustr[Math.floor(Math.random() * fuckustr.length)] });
        });
};

/**@param {import('discord.js').Message} message*/
async function findBotInfraction(message) {
    const { content, client, channel, author, guild } = message;
    const whiteListed = global.hourai.infr.channels;
    if(whiteListed[channel.id] || whiteListed[channel.parent?.id]) return;

    //Detectar infracción
    let user, member, infractionMessage;

    const msg = content.toLowerCase();
    // const blacklisted = [ /^->\w/, /^\$\w/, /^\+\w/, /^,(?!confession)\w/, /^~\w/, /^%\w/, /^[Nn][Ee][Kk][Oo] +\w/, /^[Gg]\. *\w/ ];
    const blacklisted = [ /^->\w/, /^\$\w/, /^\+\w/, /^,(?!confession)\w/, /^%\w/, /^neko +\w/, /^g\. *\w/ ];
    if(blacklisted.some(bp => msg.match(bp)) && !author.bot) {
        //Método de generalización de comando
        infractionMessage = message;
        user = author;
        member = message.member;
    } else {
        //Método de detección de respuesta
        if(!author.bot || !message.deletable) return;
        infractionMessage = await channel.messages.fetch(message.reference?.messageId).catch(_ => null);
        if(!infractionMessage?.deletable) return;

        //No amonestar dos veces
        const ifrmsg = infractionMessage.content.toLowerCase();
        if(blacklisted.some(bp => ifrmsg.match(bp))) return;

        user = infractionMessage.author;
        if(!user || user.bot) return;
        member = await guild.members.fetch(user);
    }

    const hourai = (await Hourai.findOne({})) || new Hourai({});
    const now = Date.now();
    const infractionUser = hourai.userInfractions?.[user.id]?.filter(inf => (now - inf) < (1000 * 60 * 60 * 4)) ?? [];
    
    //Sancionar según total de infracciones cometidas en las últimas 4 horas
    const infractionCount = infractionUser.push(now); //Añade el momento de la infracción actual y retorna el largo del arreglo
    hourai.userInfractions ??= {};
    hourai.userInfractions[user.id] = infractionUser;
    hourai.markModified('userInfractions');
    hourai.save().catch(console.error);
    switch(infractionCount) {
        case 1:
            return infractionMessage.react(client.emojis.cache.get('920020596526551072')).catch(auditError);

        case 2:
            return infractionMessage.react(client.emojis.cache.get('796930821554044928')).catch(auditError);

        case 3: {
            await infractionMessage.react(client.emojis.cache.get('859874631795736606')).catch(auditError);
            const roleId = '682629889702363143'; //Hanged Doll
            const reason = 'Colgado automáticamente por spam de bots';
            if(!member.roles.cache.has(roleId))
                return member.roles.add(roleId, reason).catch(auditError);
        }

        default: {
            await infractionMessage.react(client.emojis.cache.get('852764014840905738')).catch(auditError);
            const roleId = '925599922370256906'; //Crucified Doll
            const reason = 'Colgado automáticamente por spam de bots. Debido a la evasión del castigo previo, se requiere más poder para revocar la sanción';
            if(!member.roles.cache.has(roleId))
                return member.roles.add(roleId, reason).catch(auditError);
        }
    }
};

//Funciones de Respuesta Rápida personalizadas por servidor
module.exports = {
    [guildIds.hourai]: {
        findBotInfraction,
        fuckEveryOtherBot,
    },

    [guildIds.nlp]: {
        fuckEveryOtherBot,
    },

    [guildIds.slot1]: {
        fuckEveryOtherBot,
    },
}