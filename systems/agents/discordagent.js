const WebhookOwner = require('../../localdata/models/webhookOwners.js');
const { TextChannel, User, Webhook, GuildMember, Message } = require('discord.js');
const { isThread } = require('../../func.js');

/**
 * @typedef {{ userId: String, expirationDate: Date }} OwnerData
 * @type {Map<String, OwnerData>}
 */
const owners = new Map();

/**Clase para interactuar con Webhooks de Discord de forma más sencilla*/
class DiscordAgent {
    /**@type {Webhook}*/
    webhook;
    /**@type {String}*/
    threadId;
    /**@type {GuildMember | User}*/
    user;

    constructor() {
        this.webhook = null;
        this.threadId = null;
        this.user = null;
    };

    /**
     * Conecta al Agente a un canal por medio de un Webhook. Si el canal no tiene un Webhook disponible, crea uno nuevo.
     * @param {TextChannel} channel Objeto de canal o thread al cual enviar un mensaje como Agente
     * @param {String} name Nombre de muestra de Agente
     */
    async setup(channel, name = 'Agente Puré') {
        if(isThread(channel)) {
            this.threadId = channel.id;
            channel = channel.parent;
        }
        
        const channelWebhooks = await channel.fetchWebhooks();
        this.webhook = channelWebhooks.find(wh => wh.token && wh.channelId === channel.id);
        
        if(!this.webhook)
            this.webhook = await channel.createWebhook({ name, reason: 'Desplegar Agente de Puré' });

        return this;
    };

    /**
     * Establece el usuario a replicar por el Agente al enviar mensajes
     * @param {User} user
     */
    setUser(user) {
        this.user = user;
        return this;
    };

    /**
     * Establece el miembro a replicar por el Agente al enviar mensajes
     * @param {GuildMember} member
     */
    setMember(member) {
        this.user = member;
        return this;
    };

    /**
     * Envía un mensaje como el usuario especificado. Recuerda usar `setUser` o `setMember` antes.
     * @param {import('discord.js').WebhookMessageOptions} messageOptions Opciones de envío. No se puede modificar el usuario ni el canal
     * @param {Boolean} inheritAttachments Si heredar los antiguos attachments del mensaje (true) o no (false)
     */
    async sendAsUser(messageOptions, inheritAttachments = true) {
        if(!this.user)
            throw new ReferenceError('No se ha definido un usuario');

        if(!messageOptions.content)
            messageOptions.content = undefined;
        
        const { attachments } = messageOptions;
        if(inheritAttachments && attachments && !Array.isArray(attachments)) {
            messageOptions.attachments = [];
            messageOptions.files ??= [];
            messageOptions.files.push(...[ ...attachments.values() ]);
        }
        
        try {
            const sent = await this.webhook.send({
                ...messageOptions,
                threadId: this.threadId,
                username: this.#getUserName(this.user),
                avatarURL: this.user.displayAvatarURL({ size: 512 }),
                nonce: undefined,
            });

            const messageId = sent.id;
            const userId = this.user.id;
            const expirationDate = Date.now() + 3600e3;
            const webhookOwner = new WebhookOwner({ messageId, userId, expirationDate });
            owners.set(messageId, { userId, expirationDate });
            webhookOwner.save();

            const toDelete = [];
            for(const [ messageId, owner ] of owners.entries()) {
                if(Date.now > owner.expirationDate) {
                    toDelete.push(messageId);
                    WebhookOwner.deleteOne({ messageId });
                }
            }
            toDelete.forEach(dkey => owners.delete(dkey));

            return sent;
        } catch(e) {
            return console.error(e);
        }
    }

    /**
     * 
     * @param {User | GuildMember} user 
     */
    #getUserName(user) {
        if(user.nickname)
            return user.nickname;

        if(user.displayName)
            return user.displayName;

        return user.username;
    }
}

async function initializeWebhookMessageOwners() {
    const webhookOwners = await WebhookOwner.find({});
    const now = Date.now();
    webhookOwners.forEach(owner => {
        if(now < owner.expirationDate)
            owners.set(owner.messageId, { userId: owner.userId, expirationDate: owner.expirationDate });
    });
}

/**
 * @param {String} messageId 
 * @returns {String?}
 */
function getAgentMessageOwnerId(messageId) {
    const owner = owners.get(messageId);
    if(!owner) return null;
    return owner.userId;
}

/**
 * @param {Message} message 
 */
async function deleteAgentMessage(message) {
    const webhookOwner = await WebhookOwner.findOne({ messageId: message.id });

    owners.delete(message.id);

    return Promise.all([
        message.delete().catch(_ => undefined),
        webhookOwner && webhookOwner.delete(),
    ]);
}

module.exports = {
    initializeWebhookMessageOwners,
    getAgentMessageOwnerId,
    deleteAgentMessage,
    DiscordAgent,
};