const { CommandManager } = require('../../commands/Commons/cmdBuilder');
const globalConf = require('../../localdata/config.json');
const { EmbedBuilder, Colors } = require('discord.js');

/**
 * @param {import('../../commands/Commons/typings.js').CommandRequest|import('discord.js').Interaction} request
 */
function generateRequestRecord(request) {
    /**@type {import('discord.js').User}*/
    // @ts-ignore
    const user = request.author ?? request.user;
    const embed = new EmbedBuilder()
        // @ts-ignore
        .setAuthor({ name: `${request.guild.name} • ${request.channel.name}`, iconURL: user.avatarURL({ size: 128 }), url: request.url || request.channel?.url || 'https://discordapp.com' });
    return embed;
};

/**
 * @param {import('../../commands/Commons/typings.js').CommandRequest|import('discord.js').Interaction} request
 */
function getRequestContent(request) {
    if(CommandManager.requestIsInteraction(request)) {
        if(request.isContextMenuCommand())
            return `**\\*. ${request.commandName}** ${request.options.data.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;
        return `**/${request.commandName}** ${request.options.data.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;
    }

    if(CommandManager.requestIsMessage(request))
        return request.content?.slice(0, 1023) || '*Mensaje vacío.*'

    // @ts-expect-error
    if(request.customId)
        // @ts-expect-error
        return `**-=-[**\`${request.customId}\`**]**`;

    return '???';
}

/**
 * @param {import('../../commands/Commons/typings.js').CommandRequest|import('discord.js').Interaction} request
 */
async function auditRequest(request) {
    // @ts-expect-error
    if(request.customId?.startsWith('confesión')) return;

    // @ts-expect-error
    const userTag = (request.author ?? request.user).tag;
    const embed = generateRequestRecord(request)
        .addFields({ name: userTag, value: getRequestContent(request) });
        
    // @ts-expect-error
    if(request.attachments?.size)
        // @ts-expect-error
        embed.addFields({ name: 'Adjuntado:', value: request.attachments.map(attf => attf.url ?? 'https://discord.com/').join('\n').slice(0, 1023) });
    
    // @ts-expect-error
    return globalConf.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {string} title
 * @param {Array<import('discord.js').APIEmbedField>} fields
 */
async function auditSystem(title, ...fields) {
    const embed = new EmbedBuilder()
        .setColor(Colors.DarkVividPink)
        .setAuthor({ name: 'Mensaje de sistema' })
        .setTitle(title);
    if(fields.length)
        embed.setFields(fields);
    
    // @ts-ignore
    return globalConf.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {string} action
 * @param {Array<import('discord.js').APIEmbedField>} fields
 */
async function auditAction(action, ...fields) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setAuthor({ name: 'Acción realizada' })
        .setTitle(action);
    if(fields.length)
        embed.setFields(fields);
    
    // @ts-ignore
    return globalConf.logch?.send({ embeds: [embed] }).catch(console.error);
};

// function handleSubErrors(embed, errors) {
//     const key = errors.key;
//     const error = errors.error;
//     if(!Array.isArray(errors)) return;

//     embed.addFields({ name: 'Sub-error', value: `\`\`\`\n${`${error.name}` || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });

//     handleSubErrors(embed, errors.errors);
// }

/**
 * @typedef {Object} AuditErrorOptions
 * @property {import('../../commands/Commons/typings').CommandRequest|import('discord.js').Interaction} [request]
 * @property {String} [brief]
 * @property {String} [details]
 * @property {Boolean} [ping=false]
 */

/**
 * @param {Error} error
 * @param {AuditErrorOptions} param2
 */
async function auditError(error, { request = undefined, brief = undefined, details = undefined, ping = false } = { ping: false }) {
    const embed = (request ? generateRequestRecord(request) : new EmbedBuilder())
        .setColor(0x0000ff);
    
    if(request) {
        // @ts-expect-error
        const userTag = (request.author ?? request.user).tag;
        embed.addFields({ name: userTag, value: getRequestContent(request) });
    }
    embed.addFields({ name: brief || 'Ha ocurrido un error al ejecutar una acción', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
    // handleSubErrors(embed, error.errors);
        
    if(details)
        embed.addFields({ name: 'Detalle', value: details });
    
    return globalConf.logch?.send({
        content: ping ? `<@${globalConf.peopleid.papita}>` : null,
        embeds: [embed],
    }).catch(console.error);
};

module.exports = {
    auditRequest,
    auditSystem,
    auditAction,
    auditError,
};
