const { MessageFlags, TextDisplayBuilder, ContainerBuilder } = require('discord.js'); //Integrar discord.js
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require("../Commons/commands");

/**@param {import('discord.js').GuildMember} member*/
const getAvatarContainer = (member) => {
    const avatarURLDisplayOptions = /**@type {import('discord.js').ImageURLOptions}*/({ size: 1024 });
    const bannerURLDisplayOptions = /**@type {import('discord.js').ImageURLOptions}*/({ size: 512 });
    const userAvatarURL = member.user.displayAvatarURL(avatarURLDisplayOptions);
    const userBannerURL = member.user.bannerURL(bannerURLDisplayOptions);
    const memberAvatarURL = member.displayAvatarURL(avatarURLDisplayOptions);
    const memberBannerURL = member.displayBannerURL(bannerURLDisplayOptions);
    const hasServerAvatarOverride = memberAvatarURL !== userAvatarURL;
    const hasServerBannerOverride = memberBannerURL !== userBannerURL;

    const container = new ContainerBuilder()
        .setAccentColor(0xfaa61a);

    if(userBannerURL)
        container.addMediaGalleryComponents(mediaGallery =>
            mediaGallery.addItems(mediaGalleryItem =>
                mediaGalleryItem
                    .setDescription(`Portada de ${member.displayName}`)
                    .setURL(userBannerURL)
            )
        );

    container
        .addSectionComponents(section =>
            section
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('-# Perfil global'),
                    textDisplay => textDisplay.setContent(`## ${member.user.displayName}`),
                    textDisplay => textDisplay.setContent([
                        `👤 ${member.user}`,
                        `🔗 [Avatar](${userAvatarURL})`,
                        userBannerURL ? `🔗 [Portada](${userBannerURL})` : '',
                    ].join('\n')),
                )
                .setThumbnailAccessory(accessory =>
                    accessory
                        .setDescription(`Avatar global de ${member.user.displayName}`)
                        .setURL(userAvatarURL)
                )
        );
    
    //En caso de tener un override para el server
    if(hasServerAvatarOverride || hasServerBannerOverride)
        container.addSeparatorComponents(separator =>
            separator.setDivider(true)
        );
    
    if(hasServerBannerOverride)
        container.addMediaGalleryComponents(mediaGallery =>
            mediaGallery.addItems(mediaGalleryItem =>
                mediaGalleryItem
                    .setDescription(`Portada de ${member.displayName}`)
                    .setURL(userBannerURL)
            )
        );
    
    if(hasServerAvatarOverride)
        container.addSectionComponents(section =>
            section
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('-# Perfil de servidor'),
                    textDisplay => textDisplay.setContent(`## ${member.displayName}`),
                    textDisplay => textDisplay.setContent([
                        `📍 En _"${member.guild}"_`,
                        `🔗 [Avatar](${memberAvatarURL})`,
                        memberBannerURL ? `🔗 [Portada](${memberBannerURL})` : '',
                    ].join('\n')),
                )
                .setThumbnailAccessory(accessory =>
                    accessory
                        .setDescription(`Avatar de servidor de ${member.displayName}`)
                        .setURL(memberAvatarURL)
                )
        );
    
    return container;
};

/**
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request 
 * @param {CommandOptionSolver<import('../Commons/typings.js').CommandArguments>} args 
 */
function getMembers(request, args) {
    const notFound = /**@type {Array<string>}*/([]);
    const members = CommandOptionSolver.asMembers(args.parsePolyParamSync('miembros', {
        fallback: request.member,
        regroupMethod: 'MENTIONABLES-WITH-SEP',
        failedPayload: notFound,
    }));

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
        const components = /**@type {import('discord.js').ComponentBuilder[]}*/([]);
        const { found: members, notFound } = getMembers(request, args);
        
        if(notFound.length) {
            const [ templateA, templateC ] = [
                '⚠️ ¡Usuario[s] **', '** no encontrado[s]!'
            ].map(s => s.replace(/\[s\]/g, (notFound.length !== 1) ? 's' : ''));
            const templateB = notFound.join(', ');
            components.push(
                new TextDisplayBuilder().setContent([
                    [ templateA, templateB, templateC ].join(''),
                    `-# Recuerda separar cada usuario con una coma y escribir correctamente. Usa \`${p_pure(request).raw}ayuda avatar\` para más información`,
                ].join('\n'))
            );
        }

        if(members?.length) {
            const fetchedMembers = await Promise.all(members.map(m => m.fetch(true)));
            fetchedMembers?.forEach(member => {
                const avatarContainer = getAvatarContainer(member);
                avatarContainer && components.push(avatarContainer);
            });
        }

        if(!components.length) {
            await request.member.fetch(true);
            const avatarContainer = getAvatarContainer(request.member);
            components.push(avatarContainer);
        }

        return request.reply({
            flags: MessageFlags.IsComponentsV2,
            components,
        });
    });

module.exports = command;
