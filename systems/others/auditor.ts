import { Command } from '../../commands/Commons/cmdBuilder';
import { CommandRequest } from '../../commands/Commons/typings';
import { globalConfigs } from '../../data/globalProps';
import userIds from '../../data/userIds.json';
import { EmbedBuilder, Colors, Interaction, User, APIEmbedField, CommandInteraction } from 'discord.js';

function generateRequestRecord(request: CommandRequest | Interaction) {
    // @ts-expect-error
    const user: User = request.user ?? request.author;
    const embed = new EmbedBuilder()
        // @ts-expect-error
        .setAuthor({ name: `${request.guild.name} • ${request.channel.name}`, iconURL: user.avatarURL({ size: 128 }), url: request.url || request.channel?.url || 'https://discordapp.com' });
    return embed;
};

function getRequestContent(request: CommandRequest | Interaction<'cached'>) {
    if(Command.requestIsInteraction(request)) {
        if(request.isContextMenuCommand())
            return `**\\*. ${request.commandName}** ${request.options?.data?.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;

        if(request.isChatInputCommand())
            return `**/${request.commandName}** ${request.options?.data?.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;

        if(request.isMessageComponent())
            return `**-=-[**\`${request.customId}\`**]**`;

        if(request.isModalSubmit())
            return `**[[${request.customId}]]** ${request.fields.fields?.map((modalData) => `\`${modalData.customId}\``).join(' ')}`

        if(request.isAutocomplete())
            return `**?:${request.commandName}** ${request.valueOf()}`;
    }

    if(Command.requestIsMessage(request))
        return request.content?.slice(0, 1023) || '*Mensaje vacío.*'

    return `**${request.type}/${request.id}**`;
}

export async function auditRequest(request: CommandRequest | Interaction) {
    // @ts-expect-error
    if(request.customId?.startsWith('confesión')) return;

    // @ts-expect-error
    const userTag = (request.author ?? request.user).tag;
    const embed = generateRequestRecord(request)
        // @ts-expect-error
        .addFields({ name: userTag, value: getRequestContent(request) });
        
    // @ts-expect-error
    if(request.attachments?.size)
        // @ts-expect-error
        embed.addFields({ name: 'Adjuntado:', value: request.attachments.map(attf => attf.url ?? 'https://discord.com/').join('\n').slice(0, 1023) });
    
    return globalConfigs.logch?.send({ embeds: [embed] }).catch(console.error);
};

export async function auditSystem(title: string, ...fields: Array<APIEmbedField>) {
    const embed = new EmbedBuilder()
        .setColor(Colors.DarkVividPink)
        .setAuthor({ name: 'Mensaje de sistema' })
        .setTitle(title);
    if(fields.length)
        embed.setFields(fields);
    
    return globalConfigs.logch?.send({ embeds: [embed] }).catch(console.error);
};

export async function auditAction(action: string, ...fields: Array<APIEmbedField>) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setAuthor({ name: 'Acción realizada' })
        .setTitle(action);
    if(fields.length)
        embed.setFields(fields);
    
    return globalConfigs.logch?.send({ embeds: [embed] }).catch(console.error);
};

interface AuditErrorOptions {
    request?: CommandRequest | Interaction<'cached'>;
    brief?: string;
    details?: string;
    ping?: boolean;
};

export async function auditError(error: Error, { request = undefined, brief = undefined, details = undefined, ping = false }: AuditErrorOptions = { ping: false }) {
    const embed = (request ? generateRequestRecord(request) : new EmbedBuilder())
        .setColor(0x0000ff);
    
    if(request) {
        const userTag = ('author' in request ? request.author : request.user).tag;
        embed.addFields({ name: userTag, value: getRequestContent(request) });
    }

    embed.addFields({ name: brief || 'Ha ocurrido un error al ejecutar una acción', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
        
    if(details)
        embed.addFields({ name: 'Detalle', value: details });
    
    return globalConfigs.logch?.send({
        content: ping ? `<@${userIds.papita}>` : null,
        embeds: [embed],
    }).catch(console.error);
};
