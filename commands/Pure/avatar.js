const { MessageEmbed, CommandInteractionOptionResolver, Interaction } = require('discord.js'); //Integrar discord.js
const { peopleid } = require('../../localdata/config.json');
const { fetchUser } = require('../../func.js'); //Funciones globales
const { p_pure } = require('../../localdata/prefixget');
const { CommandOptionsManager } = require('../Commons/cmdOpts');

const maxusers = 10;
/**@param {Array} users*/
const avatarEmbeds = (users, guildId) => {
    const embeds = [];
    if(users.length) {
        users.forEach(user => {
            embeds.push(new MessageEmbed()
                .setTitle(`Avatar de ${user.username}`)
                .setColor('#faa61a')
                .setImage(user.avatarURL({ format: 'png', dynamic: true, size: 1024 }))
            );
        });
        embeds[embeds.length - 1].setFooter(`"${p_pure(guildId).raw}ayuda avatar" para más información`);
    }
    return embeds;
}
const options = new CommandOptionsManager()
    .addParam('usuarios', 'USER', 'para especificar usuarios', { optional: true, poly: 'MULTIPLE' });

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
    options,
    callx: '<usuario?>',

	async execute(message, args) {
		//Saber si el canal/thread es NSFW o perteneciente a un canal NSFW
		const isnsfw = message.channel.isThread()
			? message.channel.parent.nsfw
			: message.channel.nsfw;
        
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
                
                if(!user) {
                    notfound.push(arg);
                    return;
                }
                if((user.id === peopleid.papita) && !isnsfw) {
                    message.channel.send({
                        content: `Oe conchetumare te hacei el gracioso una vez más y te vai manos arriba, pantalones abajo, 'cuchai? <:junkNo:697321858407727224> <:pistolaR:697351201301463060>`
                    });
                    return;
                }

                users.push(user);
            });
        } else users.push(message.author);
        
        const nfc = `:warning: ¡Usuario[s] **${notfound.join(', ')}** no encontrado[s]!`.replace(/\[s\]/g, (notfound.length > 1) ? 's' : '');
        const embeds = avatarEmbeds(users, message.guildId);

        if(notfound.length || embeds.length)
            await message.channel.send({
                content: (notfound.length) ? nfc : null,
                embeds: embeds.length ? embeds : null,
            });
    },

    /**
     * @param {Interaction} interaction
     * @param {CommandInteractionOptionResolver} args
     * @returns
     */
    async interact(interaction, args) {
		//Saber si el canal/thread es NSFW o perteneciente a un canal NSFW
		const isnsfw = interaction.channel.isThread()
			? interaction.channel.parent.nsfw
			: interaction.channel.nsfw;

        let content = null;
        const users = options
            .fetchParamPoly(args, 'usuarios', args.getUser, interaction.user)
            .filter(user => {
                const waytoolewd = interaction.user.id !== peopleid.papita && user.id === peopleid.papita && !isnsfw;
                if(waytoolewd) {
                    content = 'Oe conchetumare te hacei el gracioso una vez más y te vai manos arriba, pantalones abajo, \'cuchai? <:junkNo:697321858407727224> <:pistolaR:697351201301463060>';
                    return;
                }

                return true;
            });
        
        const embeds = avatarEmbeds(users, interaction.guild.id);

        await interaction.reply({
            content: content,
            embeds: embeds.length ? embeds : null,
        });
    }
};