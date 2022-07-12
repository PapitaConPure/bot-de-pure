const global = require('../localdata/config.json');
const { MessageEmbed } = require('discord.js');

/**
 * @param {import('../commands/Commons/typings.js').CommandRequest} request
 */
function generateRequestRecord(request) {
    /**@type {import('discord.js').User}*/
    const user = request.author ?? request.user;
    const embed = new MessageEmbed()
        .setAuthor({ name: `${request.guild.name} • ${request.channel.name}`, iconURL: user.avatarURL({ dynamic: true }), url: request.url || 'https://discordapp.com' });
    return embed;
};

/**
 * @param {import('../commands/Commons/typings.js').CommandRequest} request
 */
function getRequestContent(request) {
    if(request.commandName)
        return `**/${request.commandName}** ${request.options.data.map(({ name, value }) => `__${name}__: ${value}`).join(' ')}`;
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
        .addField(userTag, getRequestContent(request));
        
    if(request.attachments?.size)
        embed.addField('Adjuntado:', request.attachments.map(attf => attf.url ?? 'https://discord.com/').join('\n').slice(0, 1023));
    
    return global.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {string} title
 * @param {Array<import('discord.js').EmbedFieldData>} fields
 */
async function auditSystem(title, ...fields) {
    const embed = new MessageEmbed()
        .setColor('DARK_VIVID_PINK')
        .setAuthor({ name: 'Mensaje de sistema' })
        .setTitle(title)
        .setFields(fields);
    
    return global.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {import('../commands/Commons/typings.js').CommandRequest} request
 */
async function auditAction(request) {
    const embed = generateRequestRecord(request)
        .setColor('ORANGE');
    
    return global.logch?.send({ embeds: [embed] }).catch(console.error);
};

/**
 * @param {Error} error
 * @typedef {{ request: import('../commands/Commons/typings').CommandRequest, brief: String, details: String, ping: Boolean }} AuditErrorOptions
 * @param {AuditErrorOptions} param2
 */
async function auditError(error, { request, brief, details, ping = false }) {
    const embed = (request ? generateRequestRecord(request) : new MessageEmbed())
        .setColor('#0000ff');
    
    if(request) {
        const userTag = (request.author ?? request.user).tag;
        embed.addField(userTag, getRequestContent(request));
    }
    embed.addField(brief || 'Ha ocurrido un error al ejecutar una acción', `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``);
    if(details)
        embed.addField('Detalle', details);
    
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