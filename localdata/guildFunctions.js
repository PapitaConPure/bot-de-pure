const global = require('./config.json');
const Hourai = require('./models/hourai.js');
const sid = global.serverid;

module.exports = {
    [sid.hourai]: {
        async findBotInfraction(message) {
            const { client, content, channel, author, member, id } = message;
            const infr = global.hourai.infr;
            const whitech = infr.channels;

            if(!whitech[channel.id]) {
                const msg = content.toLowerCase();
                const banpf = [ /^p![\n ]*\w/, /^!\w/, /^->\w/, /^\$\w/, /^\.\w/, /^,(?!confession)\w/, /^,,\w/, /^~\w/, /^\/\w/, /^%\w/ ];
                if(banpf.some(bp => msg.match(bp))) {
                    const hr = (await Hourai.findOne({})) || new Hourai({});
                    const now = Date.now();
                    const uinfr = infr.users;
                    const mui = author.id;
                    
                    uinfr[mui] = uinfr[mui] || [];
                    hr.userInfractions = hr.userInfractions || {};
                    
                    //Sancionar según total de infracciones cometidas en las últimas 4 horas
                    uinfr[mui] = uinfr[mui].filter(inf => (now - inf) < (1000 * 60 * 60 * 4)); //Eliminar antiguas
                    const total = uinfr[mui].push(now); //Añade el momento de la infracción actual y retorna el largo del arreglo
                    hr.userInfractions[mui] = uinfr[mui];
                    hr.markModified('userInfractions');
                    await hr.save().then(() => console.log('wawa')).catch(console.error);
                    switch(total) {
                        case 1:
                            await message.react(client.emojis.cache.get('920020596526551072')).catch(console.error);
                            break;
                        case 2:
                            await message.react(client.emojis.cache.get('796930821554044928')).catch(console.error);
                            break;
                        case 3:
                            await message.react(client.emojis.cache.get('859874631795736606')).catch(console.error);
                            const hd = '682629889702363143'; //Hanged Doll
                            try {
                                if(!member.roles.cache.has(hd))
                                    member.roles.add(hd, 'Colgado automáticamente por spam de bots');
                            } catch(err) {
                                await channel.send({ content: `<:wtfff:855940251892318238> Ese wn tiene demasiao ki\n\`\`\`\n${err.name}` });
                            }
                            break;
                        default:
                            await message.react(client.emojis.cache.get('852764014840905738')).catch(console.error);
                            const cd = '925599922370256906'; //Crucified Doll
                            try {
                                if(!member.roles.cache.has(cd))
                                    member.roles.add(cd, 'Colgado automáticamente por spam de bots. Debido a la evasión del castigo previo, se requiere más poder para revocar la sanción');
                            } catch(err) {
                                await channel.send({ content: `<:wtfff:855940251892318238> Ese wn tiene demasiao ki\n\`\`\`\n${err.name}` });
                            }
                            break;
                    }
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
        }
    },

    [sid.nlp]: {
        fuckEveryOtherBot: (message) => module.exports[sid.hourai].fuckEveryOtherBot(message)
    }
}