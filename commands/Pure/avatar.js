const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { p_pure, peopleid } = require('../../localdata/config.json');
const { fetchUser } = require('../../func.js'); //Funciones globales

const maxusers = 5;

module.exports = {
	name: 'avatar',
    aliases: [
        'perfil', 'fotoperfil',
        'profile', 'profilepicture',
        'pfp'
    ],
    desc: 'Muestra tu propio avatar o el del usuario mencionado',
    flags: [
        'common'
    ],
    options: [
        '`<usuario?>` _(mención/texto/id)_ para especificar un usuario'
    ],
    callx: '<usuario?>',

	async execute(message, args) {
        let users = [];
        let notfound = [];

        if(args.length) {
            args = args.join(' ').replace(/([\n ]*,[\n ]*)+/g, ',').split(',').filter(a => a.length > 0);
            if(args.length > maxusers) {
                message.channel.send({ content: `:warning: Solo puedes ingresar hasta **${maxusers}** usuarios por comando` });
                return;
            }
            args.forEach(arg => {
                const user = fetchUser(arg, message);
                
                if(user === undefined) {
                    notfound.push(arg);
                    return;
                }

                if((user.id === peopleid.papita) && !message.channel.nsfw) {
                    message.channel.send({
                        content: `Oe conchetumare te hacei el gracioso una vez más y te vai manos arriba, pantalones abajo, 'cuchai? <:junkNo:697321858407727224> <:pistolaR:697351201301463060>`
                    });
                    return;
                }

                users.push(user);
            });
        } else users.push(message.author);
        
        const nfc = `:warning: ¡Usuario[s] **${notfound.join(', ')}** no encontrado[s]!`.replace(/\[s\]/g, (notfound.length > 1) ? 's' : '');
        if(users.length === 0) {
            if((notfound.length)) message.channel.send({ content: nfc });
            return;
        }

        const embeds = [];
        users.forEach(user => {
            embeds.push(new MessageEmbed()
                .setTitle(`Avatar de ${user.username}`)
                .setColor('#faa61a')
                .setFooter(`"${p_pure.raw}ayuda avatar" para más información`)
                .setImage(user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            );
        });

        message.channel.send({
            content: (notfound.length) ? nfc : null,
            embeds: embeds
        });
    },
};