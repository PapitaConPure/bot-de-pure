const { TextChannel, User, Webhook, GuildMember } = require('discord.js');
const { isThread } = require('../func');

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
     * @param {import('discord.js').WebhookMessageOptions } messageOptions Opciones de envío. No se puede modificar el usuario ni el canal
     */
    async sendAsUser(messageOptions) {
        if(!this.user)
            throw new ReferenceError('No se ha definido un usuario');

        if(!messageOptions.content)
            messageOptions.content = undefined;
        
        const { attachments } = messageOptions;
        if(attachments && !Array.isArray(attachments)) {
            messageOptions.attachments = [];
            messageOptions.files ??= [];
            messageOptions.files.push(...[ ...attachments.values() ]);
        }

        try {
            // console.log(`Usuario asociado: ${this.user}`)
            // console.log(`Webhook asociado: ${this.webhook}`)
            return await this.webhook.send({
                ...messageOptions,
                threadId: this.threadId,
                username: this.user.displayName ?? this.user.username,
                avatarURL: this.user.displayAvatarURL({ size: 512 }),
                nonce: undefined,
            });
        } catch(e) {
            return console.error(e);
        }
    }
}

module.exports = {
    DiscordAgent,
};