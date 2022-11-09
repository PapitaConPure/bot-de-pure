const { TextChannel, User, MessagePayload } = require('discord.js');

class DiscordAgent {
    constructor() {
        this.webhook = null;
        this.threadId = null;
        this.user = null;
    };

    /**
     * @param {TextChannel} channel 
     * @param {String} name 
     * @returns 
     */
    async setup(channel, name = 'Agente Puré') {
        if(channel.isThread()) {
            this.threadId = channel.id;
            channel = channel.parent;
        }
        
        const channelWebhooks = await channel.fetchWebhooks();
        this.webhook = channelWebhooks.find(wh => wh.token && wh.channelId === channel.id);
        
        if(!this.webhook)
            this.webhook = await channel.createWebhook(name);

        return this;
    };

    /**
     * @param {User} user
     */
    setUser(user) {
        this.user = user;
        return this;
    };

    /**
     * 
     * @param {import('discord.js').WebhookMessageOptions } messageOptions 
     * @returns 
     */
    async sendAsUser(messageOptions) {
        if(!this.user)
            throw new ReferenceError('No se ha definido un usuario');

        try {
            // console.log(`Usuario asociado: ${this.user}`)
            // console.log(`Webhook asociado: ${this.webhook}`)
            return await this.webhook.send({
                ...messageOptions,
                threadId: this.threadId,
                username: this.user.username,
                avatarURL: this.user.avatarURL({ dynamic: true }),
            })
        } catch(e) {
            return console.error(e);
        }
    }
}

module.exports = {
    DiscordAgent,
};