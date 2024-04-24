const global = require('../localdata/config.json');
const { EmbedBuilder, Colors } = require('discord.js');

/**
 * @param {import('../commands/Commons/typings.js').CommandRequest} request
 */
function generateRequestRecord(request) {
    /**@type {import('discord.js').User}*/
    const user = request.author ?? request.user;
    const embed = new EmbedBuilder()
        .setAuthor({ name: `${request.guild.name} • ${request.channel.name}`, iconURL: user.avatarURL({ size: 128 }), url: request.url || request.channel?.url || 'https://discordapp.com' });
    return embed;
};

/**
 * @param {import('../commands/Commons/typings.js').CommandRequest} request
 */
function getRequestContent(request) {
    if(request.commandName) {
        if(request.isContextMenuCommand())
            return `**\\*. ${request.commandName}** ${request.options.data.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;
        return `**/${request.commandName}** ${request.options.data.map(({ name, value }) => `${name}:\`${value}\``).join(' ')}`;
    }
    if(request.customId)
        return `**-=-[**\`${request.customId}\`**]**`;
    return request.content?.slice(0, 1023) || '*Mensaje vacío.*'
}

/**
 * @param {import('../commands/Commons/typings.js').CommandRequest} request
 */
async function auditRequest(request) {
    const userTag = (request.author ?? request.user).tag;
    const embed = generateRequestRecord(request)
        .addFields({ name: userTag, value: getRequestContent(request) });
        
    if(request.attachments?.size)
        embed.addFields({ name: 'Adjuntado:', value: request.attachments.map(attf => attf.url ?? 'https://discord.com/').join('\n').slice(0, 1023) });
    
    return global.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {string} title
 * @param {Array<import('discord.js').EmbedFieldData>} fields
 */
async function auditSystem(title, ...fields) {
    const embed = new EmbedBuilder()
        .setColor(Colors.DarkVividPink)
        .setAuthor({ name: 'Mensaje de sistema' })
        .setTitle(title);
    if(fields.length)
        embed.setFields(fields);
    
    return global.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {string} action
 * @param {Array<import('discord.js').EmbedFieldData>} fields
 */
async function auditAction(action, ...fields) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setAuthor({ name: 'Acción realizada' })
        .setTitle(action);
    if(fields.length)
        embed.setFields(fields);
    
    return global.logch?.send({ embeds: [embed] }).catch(console.error);
};

// function handleSubErrors(embed, errors) {
//     const key = errors.key;
//     const error = errors.error;
//     if(!Array.isArray(errors)) return;

//     embed.addFields({ name: 'Sub-error', value: `\`\`\`\n${`${error.name}` || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });

//     handleSubErrors(embed, errors.errors);
// }

/**
 * @param {Error} error
 * @typedef {{ request: import('../commands/Commons/typings').CommandRequest, brief: String, details: String, ping: Boolean }} AuditErrorOptions
 * @param {AuditErrorOptions} param2
 */
async function auditError(error, { request, brief, details, ping = false } = { ping: false }) {
    const embed = (request ? generateRequestRecord(request) : new EmbedBuilder())
        .setColor(0x0000ff);
    
    if(request) {
        const userTag = (request.author ?? request.user).tag;
        embed.addFields({ name: userTag, value: getRequestContent(request) });
    }
    embed.addFields({ name: brief || 'Ha ocurrido un error al ejecutar una acción', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
    // handleSubErrors(embed, error.errors);
        
    if(details)
        embed.addFields({ name: 'Detalle', value: details });
    
    return global.logch?.send({
        content: ping ? `<@${global.peopleid.papita}>` : null,
        embeds: [embed],
    }).catch(console.error);
};

module.exports = {
    auditRequest,
    auditSystem,
    auditAction,
    auditError,
};