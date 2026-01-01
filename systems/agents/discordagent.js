const WebhookOwner = require('../../models/webhookOwners.js');
const { User, Webhook, GuildMember, Message } = require('discord.js');
const { isThread } = require('../../func');

/**
 * @typedef {{ userId: String, expirationDate: Number }} OwnerData
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
	/**@type {Promise<Boolean>}*/
	userLock;


	constructor() {
		this.webhook = null;
		this.threadId = null;
		this.user = null;
		this.userLock = Promise.resolve(false);
	};

	/**
	 * Conecta al Agente a un canal por medio de un Webhook. Si el canal no tiene un Webhook disponible, crea uno nuevo.
	 * @param {import('discord.js').GuildTextBasedChannel} channel Objeto de canal o thread al cual enviar un mensaje como Agente
	 * @param {String} name Nombre de muestra de Agente
	 */
	async setup(channel, name = 'Agente Puré') {
		let hookable;
		
		if(isThread(channel)) {
			this.threadId = channel.id;
			hookable = channel.parent;
		} else
			hookable = channel;
		
		const webhooks = await hookable.fetchWebhooks();
		this.webhook = webhooks.find(wh => wh.token && wh.channelId === hookable.id);
		
		if(!this.webhook)
			this.webhook = await hookable.createWebhook({ name, reason: 'Desplegar Agente de Puré' });

		return this;
	};

	/**
	 * Establece el usuario a replicar por el Agente al enviar mensajes
	 * @param {User} user
	 */
	setUser(user) {
		this.userLock = user.fetch()
			.then(() => {
				this.user = user;
				return true;
			})
			.catch(() => false);
		
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
	 * @param {import('discord.js').WebhookMessageCreateOptions} messageOptions Opciones de envío. No se puede modificar el usuario ni el canal
	 * @param {Boolean} [inheritAttachments] Si heredar los antiguos attachments del mensaje (true) o no (false)
	 */
	async sendAsUser(messageOptions, inheritAttachments = true) {
		await this.userLock;

		if(!this.user)
			throw new ReferenceError('No se ha definido un usuario');

		if(!messageOptions.content)
			messageOptions.content = undefined;
		
		const { attachments } = messageOptions;
		if(inheritAttachments && attachments && !Array.isArray(attachments)) {
			messageOptions.files ??= [];
			messageOptions.files.push(...[ ...attachments.values() ]);
			messageOptions.attachments = [];
		}
		
		let sent = null;
		try {
			sent = await this.webhook.send({
				threadId: this.threadId,
				username: this.#getUserName(this.user),
				avatarURL: this.user.displayAvatarURL({ size: 512 }),
				content: messageOptions.content,
				files: messageOptions.files,
				embeds: messageOptions.embeds,
			});

			addAgentMessageOwner(sent, this.user.id);
		} catch(e) {
			console.error(e);
		} finally {
			return sent;
		}
	}

	/**
	 * 
	 * @param {User | GuildMember} user 
	 */
	#getUserName(user) {
		if('nickname' in user && user.nickname != null)
			return user.nickname;

		if(user.displayName)
			return user.displayName;

		return (/**@type {User}*/ (user)).username;
	}
}

async function initializeWebhookMessageOwners() {
	const webhookOwners = await WebhookOwner.find({});
	const now = Date.now();
	for(const owner of webhookOwners) {
		if(now < owner.expirationDate)
			owners.set(owner.messageId, { userId: owner.userId, expirationDate: owner.expirationDate });
		else
			await owner.delete();
	}
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
 * 
 * @param {Message<Boolean>} sent 
 * @param {String} [ownerId] 
 */
async function addAgentMessageOwner(sent, ownerId = undefined) {
	//Crear nuevo
	const messageId = sent.id;
	const userId = ownerId ?? sent.mentions?.repliedUser?.id ?? sent.author.id;
	const expirationDate = Date.now() + 3600e3;
	const webhookOwner = new WebhookOwner({ messageId, userId, expirationDate });
	owners.set(messageId, { userId, expirationDate });
	webhookOwner.save();
}

async function updateAgentMessageOwners() {
	//Expirar viejos
	const toDelete = [];
	for(const [ messageId, owner ] of owners.entries()) {
		if(Date.now() > owner.expirationDate) {
			toDelete.push(messageId);
			await WebhookOwner.deleteOne({ messageId });
		}
	}

	//Borrar expirados
	toDelete.forEach(dkey => owners.delete(dkey));
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
	addAgentMessageOwner,
	getAgentMessageOwnerId,
	updateAgentMessageOwners,
	deleteAgentMessage,
	DiscordAgent,
};