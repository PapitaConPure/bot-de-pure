const global = require('./config.json');
const sid = global.serverid;

module.exports = {
    [sid.hourai]: {
        async findBotInfraction({ content, channel, author, member, id }) {
            const infr = global.hourai.infr;
            const whitech = infr.channels;

            if(!whitech[channel.id]) {
                const msg = content.toLowerCase();
                const banpf = [ /^p![\n ]*\w/, /^!\w/, /^->\w/, /^\$\w/, /^\.\w/, /^,(?!confession)\w/, /^,,\w/, /^~\w/, /^\/\w/ ];
                if(banpf.some(bp => msg.match(bp))) {
                    const now = Date.now();
                    const uinfr = infr.users;
                    const mui = author.id;
                    
                    if(!uinfr[mui])
                    uinfr[mui] = [];
                    
                    //Sancionar según total de infracciones cometidas en los últimos 40 minutos
                    uinfr[mui] = uinfr[mui].filter(inf => (now - inf) < (1000 * 60 * 40)); //Eliminar antiguas
                    const total = uinfr[mui].push(now); //Añade el momento de la infracción actual y retorna el largo del arreglo
                    let imsg;
                    switch(total) {
                    case 1:
                        imsg = await channel.send({
                            reply: { messageReference: id },
                            content: `Detecto... bots fuera de botposteo <:empty:856369841107632129>`
                        });
                        break;
                    case 2:
                        imsg = await channel.send({
                            reply: { messageReference: id },
                            allowedMentions: { repliedUser: true },
                            content: `Párale conchetumare, vete a <#${Object.keys(whitech).find(key => whitech[key] === 'botposting')}> <:despair:852764014840905738>`
                        });
                        break;
                    default:
                        imsg = await channel.send({
                            reply: { messageReference: id },
                            allowedMentions: { repliedUser: true },
                            content: 'Ahora sí te cagaste ijoelpico <:tenshismug:859874631795736606>'
                        });
                        const hd = '682629889702363143'; //Hanged Doll
                        try {
                            if(!member.roles.cache.some(r => r.id === hd))
                                member.roles.add(hd);
                        } catch(err) {
                            imsg = await channel.send({ content: `<:wtfff:855940251892318238> Ese wn tiene demasia'o ki. Cuélgalo tú po'.\n\`\`\`\n${err.name}` });
                        }
                        break;
                    }
                    setTimeout(() => imsg.delete(), 1000 * 5);
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

        replyQue({ content, channel }) {
            if(['q', 'que', 'qué'].some(i => i === content.toLowerCase()))
                channel.send({ files: ['https://media.discordapp.net/attachments/670865125154095143/834115384927191080/so_epico-1.jpg?width=394&height=700'] });
        }
    },

    [sid.nlp]: {
        fuckEveryOtherBot: (message) => module.exports[sid.hourai].fuckEveryOtherBot(message)
    }
}