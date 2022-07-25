const { MessageEmbed } = require('discord.js'); //Integrar discord.js
const { fetchUser, regroupText, fetchMember } = require('../../func.js'); //Funciones globales
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager } = require("../Commons/commands");

const maxusers = 10;
/**@param {import('discord.js').GuildMember} member*/
const getAvatarEmbed = (member) => {
    const urlDisplayOptions = { format: 'png', dynamic: true, size: 1024 };
    const memberAvatarUrl = member.displayAvatarURL(urlDisplayOptions);
    const embed = new MessageEmbed()
        .setColor('#faa61a')
        .setImage(memberAvatarUrl)
        .addFields({ name: `Avatar de ${member.displayName}`, value: `[🔗 Enlace](${memberAvatarUrl})`, inline: true });
    
    //En caso de tener un override para el server
    const userAvatarUrl = member.user.displayAvatarURL(urlDisplayOptions);
    if(userAvatarUrl !== memberAvatarUrl)
        embed.setThumbnail(userAvatarUrl)
            .setDescription(`Visto desde "${member.guild}"`, true)
            .addFields({ name: 'Global', value: `[🔗 Enlace](${userAvatarUrl})`, inline: true });
    
    return embed;
};
const generateAvatarEmbeds = (members = [], guildId = '0') => {
    const embeds = [];
    if(members.length) {
        members.forEach(member => embeds.push(getAvatarEmbed(member)));
        embeds[embeds.length - 1].setFooter({ text: `"${p_pure(guildId).raw}ayuda avatar" para más información` });
    }
    return embeds;
};

const options = new CommandOptionsManager()
    .addParam('usuarios', 'USER', 'para especificar usuarios', { optional: true, poly: 'MULTIPLE' });

module.exports = {
	name: 'avatar',
    aliases: [
        'perfil', 'fotoperfil',
        'profile', 'profilepicture',
        'pfp',
    ],
    brief: 'Muestra tu propio avatar o el del usuario mencionado',
    desc: [
        'Muestra tu propio avatar o el del usuario mencionado',
        'Puedes buscar por ID, mención, etiqueta, nombre o apodo. Para búsquedas múltiples, separa los términos con comas',
        'Se priorizan resultados del servidor actual, pero la búsqueda tiene un rango de todos los servidores a los que tengo acceso',
    ].join('\n'),
    flags: new CommandMetaFlagsManager().add('COMMON'),
    options,
    callx: '<usuario?>',
    experimental: true,

    /**
     * @param {import('../Commons/typings').CommandRequest} request
     * @param {import('../Commons/typings').CommandOptions} args
     * @param {Boolean} isSlash
     * @returns
     */
	async execute(request, args, isSlash) {
        const notfound = [];
        let members;
        let replyStack = {};

        if(isSlash)
            members = options.fetchParamPoly(args, 'usuarios', args.getMember, request.member);
        else {
            members = [];
            if(args.length) {
                args = regroupText(args);
                if(args.length > maxusers)
                    return request.reply({ content: `:warning: Solo puedes ingresar hasta **${maxusers}** usuarios por comando` });
                
                args.forEach(arg => {
                    const member = fetchMember(arg, request);
                    if(!member) return notfound.push(arg);
                    members.push(member);
                });
            } else members.push(request.member);
        }
        
        if(notfound.length)
            replyStack.content = [
                `:warning: ¡Usuario[s] **${notfound.join(', ')}** no encontrado[s]!`.replace(/\[s\]/g, (notfound.length > 1) ? 's' : ''),
                `Recuerda separar cada usuario con una coma y escribir correctamente. Usa \`${p_pure(request.guildId).raw}ayuda avatar\` para más información`,
            ].join('\n');
        if(members?.length)
            replyStack.embeds = generateAvatarEmbeds(members, request.guildId) ?? null;

        await request.reply(replyStack);
    },
};