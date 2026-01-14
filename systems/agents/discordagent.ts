import WebhookOwner from '../../models/webhookOwners.js';
import { AnyThreadChannel, GuildBasedChannel, GuildMember, GuildTextBasedChannel, Message, User, Webhook, WebhookMessageCreateOptions } from 'discord.js';
import { isThread } from '../../func';

interface OwnerData {
	userId: string;
	expirationDate: number;
};
const owners: Map<string, OwnerData> = new Map();

/**@class Clase para interactuar con Webhooks de Discord de forma más sencilla.*/
export class DiscordAgent {
	webhook: Webhook;
	threadId: string;
	user: GuildMember | User;
	userLock: Promise<boolean>;

	constructor() {
		this.webhook = null;
		this.threadId = null;
		this.user = null;
		this.userLock = Promise.resolve(false);
	};

	/**
	 * @description Conecta al Agente a un canal por medio de un Webhook. Si el canal no tiene un Webhook disponible, crea uno nuevo.
	 * @param channel Objeto de canal o thread al cual enviar un mensaje como Agente
	 * @param name Nombre de muestra de Agente
	 */
	async setup(channel: GuildTextBasedChannel | AnyThreadChannel, name: string = 'Agente Puré') {
		let hookable: GuildBasedChannel;
		
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

	/**@description Establece el usuario a replicar por el Agente al enviar mensajes.*/
	setUser(user: User) {
		this.userLock = user.fetch()
			.then(() => {
				this.user = user;
				return true;
			})
			.catch(() => false);
		
		return this;
	};

	/**@description Establece el miembro a replicar por el Agente al enviar mensajes.*/
	setMember(member: GuildMember) {
		this.user = member;
		return this;
	};

	/**
	 * @description Envía un mensaje como el usuario especificado. Recuerda usar `setUser` o `setMember` antes.
	 * @param messageOptions Opciones de envío. No se puede modificar el canal
	 * @param inheritAttachments Si heredar los antiguos attachments del mensaje (true) o no (false)
	 */
	async sendAsUser(messageOptions: WebhookMessageCreateOptions, inheritAttachments: boolean = true) {
		await this.userLock;

		if(!this.user)
			throw new ReferenceError('No se ha definido un usuario');

		if(!messageOptions.content)
			messageOptions.content = undefined;
		
		//@ts-expect-error
		const { attachments, username } = messageOptions;
		if(inheritAttachments && attachments && !Array.isArray(attachments)) {
			messageOptions.files ??= [];
			//@ts-expect-error
			messageOptions.files.push(...[ ...attachments.values() ]);
			//@ts-expect-error
			messageOptions.attachments = [];
		}
		
		let sent = null;
		
		try {
			sent = await this.webhook.send({
				threadId: this.threadId,
				username: username ?? this.#getUserName(this.user),
				avatarURL: this.user.displayAvatarURL({ size: 512 }),
				content: messageOptions.content,
				files: messageOptions.files,
				embeds: messageOptions.embeds,
			});

			addAgentMessageOwner(sent, this.user.id);
		} catch(e) {
			console.error(e);
		}

		return sent;
	}

	#getUserName(user: User | GuildMember) {
		if('nickname' in user && user.nickname != null)
			return user.nickname;

		if(user.displayName)
			return user.displayName;

		return (user as User).username;
	}
}

export async function initializeWebhookMessageOwners() {
	const webhookOwners = await WebhookOwner.find({});
	const now = Date.now();
	for(const owner of webhookOwners) {
		if(now < owner.expirationDate)
			owners.set(owner.messageId, { userId: owner.userId, expirationDate: owner.expirationDate });
		else
			await owner.delete();
	}
}

export function getAgentMessageOwnerId(messageId: string): string | null {
	const owner = owners.get(messageId);
	if(!owner) return null;
	return owner.userId;
}

export async function addAgentMessageOwner(sent: Message, ownerId: string = undefined) {
	//Crear nuevo
	const messageId = sent.id;
	const userId = ownerId ?? sent.mentions?.repliedUser?.id ?? sent.author.id;
	const expirationDate = Date.now() + 3600e3;
	const webhookOwner = new WebhookOwner({ messageId, userId, expirationDate });
	owners.set(messageId, { userId, expirationDate });
	webhookOwner.save();
}

export async function updateAgentMessageOwners() {
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

export async function deleteAgentMessage(message: Message) {
	const webhookOwner = await WebhookOwner.findOne({ messageId: message.id });

	owners.delete(message.id);

	return Promise.all([
		message.delete().catch(() => undefined),
		webhookOwner && webhookOwner.delete(),
	]);
}
