import { Command } from '../../commands/Commons/cmdBuilder';
import { CommandRequest } from '../../commands/Commons/typings';
import globalConf from '../../data/config.json';
import { EmbedBuilder, Colors, Interaction, User, APIEmbedField, InteractionType } from 'discord.js';

function generateRequestRecord(request: CommandRequest | Interaction) {
    // @ts-expect-error
    const user: User = request.user ?? request.author;
    const embed = new EmbedBuilder()
        // @ts-expect-error
        .setAuthor({ name: `${request.guild.name} • ${request.channel.name}`, iconURL: user.avatarURL({ size: 128 }), url: request.url || request.channel?.url || 'https://discordapp.com' });
    return embed;
};

function getRequestContent(request: CommandRequest | InteractionType) {
    // @ts-expect-error
    if(Command.requestIsInteraction(request)) {
        if(request.isContextMenuCommand())
            // @ts-expect-error
            return `**\\*. ${request.commandName}** ${request.options.data.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;

        return `**/${request.commandName}** ${request.options.data.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;
    }

    // @ts-expect-error
    if(Command.requestIsMessage(request))
        return request.content?.slice(0, 1023) || '*Mensaje vacío.*'

    // @ts-expect-error
    if(request.customId)
        // @ts-expect-error
        return `**-=-[**\`${request.customId}\`**]**`;

    return '???';
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
    
    // @ts-expect-error
    return globalConf.logch?.send({ embeds: [embed] }).catch(console.error);
};

export async function auditSystem(title: string, ...fields: Array<APIEmbedField>) {
    const embed = new EmbedBuilder()
        .setColor(Colors.DarkVividPink)
        .setAuthor({ name: 'Mensaje de sistema' })
        .setTitle(title);
    if(fields.length)
        embed.setFields(fields);
    
    // @ts-expect-error
    return globalConf.logch?.send({ embeds: [embed] }).catch(console.error);
};

export async function auditAction(action: string, ...fields: Array<APIEmbedField>) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setAuthor({ name: 'Acción realizada' })
        .setTitle(action);
    if(fields.length)
        embed.setFields(fields);
    
    // @ts-expect-error
    return globalConf.logch?.send({ embeds: [embed] }).catch(console.error);
};

interface AuditErrorOptions {
    request?: CommandRequest | Interaction;
    brief?: String;
    details?: String;
    ping?: Boolean;
};

export async function auditError(error: Error, { request = undefined, brief = undefined, details = undefined, ping = false }: AuditErrorOptions = { ping: false }) {
    const embed = (request ? generateRequestRecord(request) : new EmbedBuilder())
        .setColor(0x0000ff);
    
    if(request) {
        // @ts-expect-error
        const userTag = (request.author ?? request.user).tag;
        // @ts-expect-error
        embed.addFields({ name: userTag, value: getRequestContent(request) });
    }
    // @ts-expect-error
    embed.addFields({ name: brief || 'Ha ocurrido un error al ejecutar una acción', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
    // handleSubErrors(embed, error.errors);
        
    if(details)
        // @ts-expect-error
        embed.addFields({ name: 'Detalle', value: details });
    
    // @ts-expect-error
    return globalConf.logch?.send({
        // @ts-expect-error
        content: ping ? `<@${globalConf.peopleid.papita}>` : null,
        embeds: [embed],
    }).catch(console.error);
};
