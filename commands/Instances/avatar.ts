import { MessageFlags, TextDisplayBuilder, ContainerBuilder, GuildMember, ImageURLOptions } from 'discord.js';
import { p_pure } from '../../utils/prefixes';
import { CommandOptions, CommandTags, Command, CommandOptionSolver } from '../Commons/';
import { Translator } from '../../i18n';
import { fetchGuildMembers } from '../../utils/guildratekeeper';
import { ComplexCommandRequest } from '../Commons/typings.js';

const getAvatarContainer = (member: GuildMember, translator: Translator) => {
    const avatarURLDisplayOptions: ImageURLOptions = { size: 4096 };
    const bannerURLDisplayOptions: ImageURLOptions = { size: 4096 };
    const userAvatarURL = member.user.displayAvatarURL(avatarURLDisplayOptions);
    const userBannerURL = member.user.bannerURL(bannerURLDisplayOptions);
    const memberAvatarURL = member.displayAvatarURL(avatarURLDisplayOptions);
    const memberBannerURL = member.displayBannerURL(bannerURLDisplayOptions);
    const hasServerAvatarOverride = memberAvatarURL !== userAvatarURL;
    const hasServerBannerOverride = memberBannerURL !== userBannerURL;

    const container = new ContainerBuilder()
        .setAccentColor(member.user.accentColor || member.displayColor || 0xfaa61a);

    if(userBannerURL)
        container.addMediaGalleryComponents(mediaGallery =>
            mediaGallery.addItems(mediaGalleryItem =>
                mediaGalleryItem
                    .setDescription(translator.getText('avatarGlobalBannerAlt', member.user.displayName))
                    .setURL(userBannerURL)
            )
        );

    container
        .addSectionComponents(section =>
            section
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(translator.getText('avatarGlobalProfileEpigraph')),
                    textDisplay => textDisplay.setContent(`## ${member.user.displayName}`),
                    textDisplay => textDisplay.setContent([
                        `👤 ${member.user}`,
                        `🔗 [${translator.getText('avatarAvatar')}](${userAvatarURL})`,
                        userBannerURL ? `🔗 [${translator.getText('avatarBanner')}](${userBannerURL})` : '',
                    ].join('\n')),
                )
                .setThumbnailAccessory(accessory =>
                    accessory
                        .setDescription(translator.getText('avatarGlobalAvatarAlt', member.user.displayName))
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
                    .setDescription(translator.getText('avatarGuildBannerAlt', member.displayName))
                    .setURL(memberBannerURL)
            )
        );
    
    if(hasServerAvatarOverride)
        container.addSectionComponents(section =>
            section
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(translator.getText('avatarGuildProfileEpigraph')),
                    textDisplay => textDisplay.setContent(`## ${member.displayName}`),
                    textDisplay => textDisplay.setContent([
                        translator.getText('avatarGuildProfileSource', member.guild),
                        `🔗 [${translator.getText('avatarAvatar')}](${memberAvatarURL})`,
                        memberBannerURL ? `🔗 [${translator.getText('avatarBanner')}](${memberBannerURL})` : '',
                    ].join('\n')),
                )
                .setThumbnailAccessory(accessory =>
                    accessory
                        .setDescription(translator.getText('avatarGuildAvatarAlt', member.displayName))
                        .setURL(memberAvatarURL)
                )
        );
    
    return container;
};

function getMembers(request: ComplexCommandRequest, args: CommandOptionSolver) {
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

const tags = new CommandTags().add('COMMON');

const command = new Command('avatar', tags)
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
        const [ translator ] = await Promise.all([
            Translator.from(request),
            fetchGuildMembers(request.guild),
        ]);

        const components = /**@type {import('discord.js').ComponentBuilder[]}*/([]);
        const { found: members, notFound } = getMembers(request, args);
        
        if(notFound.length) {
            components.push(
                new TextDisplayBuilder().setContent(
                    translator.getText('avatarUserNotFoundNotice', notFound.join(', '), notFound.length, p_pure(request).raw)
                )
            );
        }

        if(members?.length) {
            const fetchedMembers = await Promise.all(members.map(m => m.fetch(true)));
            fetchedMembers?.forEach(member => {
                const avatarContainer = getAvatarContainer(member, translator);
                avatarContainer && components.push(avatarContainer);
            });
        }

        if(!components.length) {
            await request.member.fetch(true);
            const avatarContainer = getAvatarContainer(request.member, translator);
            components.push(avatarContainer);
        }

        return request.reply({
            flags: MessageFlags.IsComponentsV2,
            components,
        });
    });

export default command;
