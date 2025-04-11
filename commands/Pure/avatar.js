const { EmbedBuilder } = require('discord.js'); //Integrar discord.js
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require("../Commons/commands");

/**@param {import('discord.js').GuildMember} member*/
const getAvatarEmbed = (member) => {
    const urlDisplayOptions = /**@type {const}*/({ size: 1024 });
    const memberAvatarUrl = member.displayAvatarURL(urlDisplayOptions);
    const embed = new EmbedBuilder()
        .setColor(0xfaa61a)
        .setImage(memberAvatarUrl)
        .addFields({ name: `Avatar de ${member.displayName}`, value: `[🔗 Enlace](${memberAvatarUrl})`, inline: true });
    
    //En caso de tener un override para el server
    const userAvatarUrl = member.user.displayAvatarURL(urlDisplayOptions);
    if(userAvatarUrl !== memberAvatarUrl)
        embed.setThumbnail(userAvatarUrl)
            .setDescription(`Visto desde "${member.guild}"`)
            .addFields({ name: 'Global', value: `[🔗 Enlace](${userAvatarUrl})`, inline: true });
    
    return embed;
};

/**@param {Array<import('discord.js').GuildMember>} members*/
const generateAvatarEmbeds = (members = []) => {
    const embeds = [];

    if(members.length)
        members.forEach(member => embeds.push(getAvatarEmbed(member)));
    
    return embeds;
};

/**
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request 
 * @param {CommandOptionSolver<import('../Commons/typings.js').CommandArguments>} args 
 */
async function getMembers(request, args) {
    const notFound = /**@type {Array<string>}*/([]);
    const members = CommandOptionSolver.asMembers(await args.parsePolyParam('miembros', {
        fallback: request.member,
        regroupMethod: 'MENTIONABLES-WITH-SEP',
        failedPayload: notFound,
    })).filter(m => m || (notFound.push(), false));

    if(request.isInteraction)
        return {
            found: members,
            notFound,
        };

    return {
        found: members,
        notFound,
    };
}

const options = new CommandOptions()
    .addParam('miembros', 'MEMBER', 'para indicar miembros de los cuales obtener avatares', { optional: true, poly: 'MULTIPLE', polymax: 10 });

const flags = new CommandTags().add('COMMON');

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
    .setExecution(async (request, args) => {
        const { found: members, notFound } = await getMembers(request, args);
        const replyStack = {};

        await request.guild.members.fetch();
        
        if(notFound.length) {
            const [ templateA, templateC ] = [
                '⚠️ ¡Usuario[s] **', '** no encontrado[s]!'
            ].map(s => s.replace(/\[s\]/g, (notFound.length !== 1) ? 's' : ''));
            const templateB = notFound.join(', ');
            replyStack.content = [
                [ templateA, templateB, templateC ].join(''),
                `Recuerda separar cada usuario con una coma y escribir correctamente. Usa \`${p_pure(request).raw}ayuda avatar\` para más información`,
            ].join('\n');
        }
        if(members?.length)
            replyStack.embeds = generateAvatarEmbeds(members) ?? null;

        await request.reply(replyStack);
    });

module.exports = command;
