const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { p_pure, peopleid } = require('../../localdata/config.json');
const { fetchUserID } = require('../../func.js'); //Funciones globales

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
        const embed = new MessageEmbed()
            .setColor('#faa61a')
            .setFooter(`"${p_pure.raw}ayuda avatar" para más información`)
        if(!args.length) {
            embed.setTitle(`Avatar de ${message.author.username}`)
                .setImage(message.author.avatarURL({ format: 'png', dynamic: true, size: 1024 }));
            
            message.channel.send({ embeds: [embed] });
        } else {
            args = args.join(' ').split(',');
            if(args.length < 5)
                args.map(arg => {
                    arg = arg.trim();
                    if(arg.length === 0) return;
                    const user = fetchUserID(arg, message.channel.guild, message.client);

                    if((user === peopleid.papita) && !message.channel.nsfw) {
                        message.channel.send({
                            content: `Oe conchetumare te hacei el gracioso una vez más y te vai manos arriba, pantalones abajo, 'cuchai? <:junkNo:697321858407727224> <:pistolaR:697351201301463060>`
                        });
                        return;
                    }
                    
                    if(user !== undefined) {
                        const fetcheduser = message.client.users.cache.get(user);

                        embed.setTitle(`Avatar de ${fetcheduser.username}`)
                            .setImage(fetcheduser.avatarURL({ dynamic: true, size: 1024 }));

                        message.channel.send({ embeds: [embed] });
                    } else 
                        message.channel.send({ content: `:warning: ¡Usuario **${arg}** no encontrado!` });
                });
            else
                message.channel.send({ content: ':warning: Solo puedes ingresar hasta **5** usuarios por comando' });
        }
    },
};