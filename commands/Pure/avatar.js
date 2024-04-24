const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { regroupText, fetchMember } = require('../../func.js'); //Funciones globales
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptionsManager, CommandMetaFlagsManager, CommandManager } = require("../Commons/commands");

const maxusers = 10;
/**@param {import('discord.js').GuildMember} member*/
const getAvatarEmbed = (member) => {
    const urlDisplayOptions = { size: 1024 };
    const memberAvatarUrl = member.displayAvatarURL(urlDisplayOptions);
    const embed = new EmbedBuilder()
        .setColor(0xfaa61a)
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

    if(members.length)
        members.forEach(member => embeds.push(getAvatarEmbed(member)));
    
    return embeds;
};
function getMembers(request, args, isSlash) {
    if(isSlash)
        return [ options.fetchParamPoly(args, 'usuarios', args.getMember, request.member), [] ];

    if(!args.length)
        return [ [ request.member ], [] ];
    
    args = regroupText(args);
    if(args.length > maxusers)
        args = args.slice(0, 8);
    
    const members = [];
    const notFound = [];
    args.forEach(arg => {
        const member = fetchMember(arg, request);
        if(!member) return notFound.push(arg);
        members.push(member);
    });

    return [ members, notFound ];
}

const options = new CommandOptionsManager()
    .addParam('usuarios', 'USER', 'para especificar usuarios', { optional: true, poly: 'MULTIPLE' });
const flags = new CommandMetaFlagsManager().add('COMMON');
const command = new CommandManager('avatar', flags)
    .setAliases(
        'perfil', 'fotoperfil',
        'profile', 'profilepicture',
        'pfp', 'av',
    )
    .setBriefDescription('Muestra tu propio avatar o el del usuario mencionado')
    .setLongDescription(
        'Muestra tu propio avatar o el del usuario mencionado',
        'Puedes buscar por ID, mención, etiqueta, nombre o apodo. Para búsquedas múltiples, separa los términos con comas',
        'Se priorizan resultados del servidor actual, pero la búsqueda tiene un rango de todos los servidores a los que tengo acceso',
    )
    .setOptions(options)
    .setExecution(async (request, args, isSlash) => {
        const [ members, notFound ] = getMembers(request, args, isSlash);
        let replyStack = {};
        
        if(notFound.length)
            replyStack.content = [
                `⚠️ ¡Usuario[s] **${notFound.join(', ')}** no encontrado[s]!`.replace(/\[s\]/g, (notFound.length > 1) ? 's' : ''),
                `Recuerda separar cada usuario con una coma y escribir correctamente. Usa \`${p_pure(request.guildId).raw}ayuda avatar\` para más información`,
            ].join('\n');
        if(members?.length)
            replyStack.embeds = generateAvatarEmbeds(members, request.guildId) ?? null;

        await request.reply(replyStack);
    });

module.exports = command;