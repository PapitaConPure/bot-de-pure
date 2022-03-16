const global = require('./config.json');
const Hourai = require('./models/hourai.js');
const guildIds = global.serverid;

module.exports = {
    [guildIds.hourai]: {
        async findBotInfraction(message) {
            const { client, content, channel, author, member } = message;
            const whiteListed = global.hourai.infr.channels;
            if(whiteListed[channel.id] || whiteListed[channel.parent?.id]) return;

            const msg = content.toLowerCase();
            const blacklisted = [ /^[Pp] *![\n ]*\w/, /^!\w/, /^->\w/, /^\$\w/, /^\.\w/, /^,(?!confession)\w/, /^,,\w/, /^~\w/, /^\/\w/, /^%\w/, /^[Nn][Ee][Kk][Oo] +\w/, /^[Gg].+\w/ ];
            if(!blacklisted.some(bp => msg.match(bp))) return;

            const hourai = (await Hourai.findOne({})) || new Hourai({});
            const now = Date.now();
            const infractionUser = hourai.userInfractions?.[author.id]?.filter(inf => (now - inf) < (1000 * 60 * 60 * 4)) ?? [];
            
            //Sancionar según total de infracciones cometidas en las últimas 4 horas
            const infractionCount = infractionUser.push(now); //Añade el momento de la infracción actual y retorna el largo del arreglo
            hourai.userInfractions = hourai.userInfractions ?? {};
            hourai.userInfractions[author.id] = infractionUser;
            hourai.markModified('userInfractions');
            await hourai.save().catch(console.error);
            switch(infractionCount) {
                case 1:
                    return await message.react(client.emojis.cache.get('920020596526551072')).catch(console.error);

                case 2:
                    return await message.react(client.emojis.cache.get('796930821554044928')).catch(console.error);

                case 3: {
                    await message.react(client.emojis.cache.get('859874631795736606')).catch(console.error);
                    const roleId = '682629889702363143'; //Hanged Doll
                    const reason = 'Colgado automáticamente por spam de bots';
                    if(!member.roles.cache.has(roleId))
                        return await member.roles.add(roleId, reason).catch(console.error);
                }

                default: {
                    await message.react(client.emojis.cache.get('852764014840905738')).catch(console.error);
                    const roleId = '925599922370256906'; //Crucified Doll
                    const reason = 'Colgado automáticamente por spam de bots. Debido a la evasión del castigo previo, se requiere más poder para revocar la sanción';
                    if(!member.roles.cache.has(roleId))
                        return await member.roles.add(roleId, reason).catch(console.error);
                }
            }
        },

        fuckEveryOtherBot({ content, channel, author }) {
            content = content.toLowerCase();
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
        },
    },

    [guildIds.nlp]: {
        fuckEveryOtherBot: (message) => module.exports[guildIds.hourai].fuckEveryOtherBot(message),
    }
}