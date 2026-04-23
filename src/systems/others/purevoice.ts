'use strict';

import chalk from 'chalk';
import type {
	GuildMember,
	MessageCreateOptions,
	MessagePayload,
	Role,
	TextChannel,
	VoiceBasedChannel,
	VoiceState,
} from 'discord.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	Guild,
} from 'discord.js';
import type { ValuesOf } from 'types';
import { tenshiColor } from '@/data/globalProps.js';
import { Translator } from '@/i18n/index.js';
import type { PureVoiceDocument } from '@/models/purevoice.js';
import { PureVoiceModel, PureVoiceSessionModel } from '@/models/purevoice.js';
import type { UserConfigSchemaType } from '@/models/userconfigs.js';
import UserConfigModel from '@/models/userconfigs.js';
import { getBotEmoji, getBotEmojiResolvable } from '@/utils/emojis';
import Logger from '@/utils/logs.js';
import { p_pure } from '@/utils/prefixes';

const { debug, info, warn, error } = Logger('WARN', 'PV');

export function makePVSessionName(name: string, emoji?: string | null) {
	return `${emoji || '💠'}【${name}】`;
}

export function makeSessionAutoname(userConfig: UserConfigSchemaType) {
	if (!userConfig?.voice?.autoname) return null;
	return makePVSessionName(userConfig.voice.autoname, userConfig.voice.autoemoji);
}

export function makeSessionRoleAutoname(userConfig: UserConfigSchemaType) {
	if (!userConfig?.voice?.autoname) return null;
	return `${userConfig.voice.autoemoji || '💠'} ${userConfig.voice.autoname}`;
}

class PureVoiceDocumentHandler {
	#document: PureVoiceDocument | undefined;

	/**@description Intenta conseguir un documento de sistema PuréVoice del servidor relacionado al cambio detectado, en la base de datos*/
	async fetchSystemDocument(documentQuery: object): Promise<PureVoiceDocument | undefined> {
		this.#document = (await PureVoiceModel.findOne(documentQuery).catch((err) => {
			error(err);
			return undefined;
		})) as PureVoiceDocument | undefined;

		return this.#document;
	}

	async relinkDocument() {
		if (!this.#document)
			throw new PureVoiceDocumentHandlerError(
				'Expected PuréVoice document to be initialized before relinking it.',
			);

		const documentId = this.#document._id;
		this.#document = (await PureVoiceModel.findById(documentId).catch((err) => {
			error(err);
			return undefined;
		})) as PureVoiceDocument | undefined;

		return this.#document;
	}

	async saveChanges() {
		if (!this.#document)
			throw new PureVoiceDocumentHandlerError(
				'Expected PuréVoice document to be initialized before saving changes.',
			);

		return this.#document.save();
	}

	isInitialized() {
		return !!this.#document;
	}

	get document() {
		if (!this.#document)
			throw new PureVoiceDocumentHandlerError(
				'Expected PuréVoice document to be initialized before accessing it externally.',
			);

		return this.#document;
	}
}

export class PureVoiceDocumentHandlerError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = PureVoiceDocumentHandlerError.name;
	}
}

export class PureVoiceUpdateHandler {
	#documentHandler: PureVoiceDocumentHandler;
	#oldState: VoiceState;
	#state: VoiceState;

	/**@description Crea un nuevo Handler para una actualización de estado de un canal de voz con Sistema PuréVoice.*/
	constructor(oldState: VoiceState, state: VoiceState) {
		this.#documentHandler = new PureVoiceDocumentHandler();
		this.#oldState = oldState;
		this.#state = state;
	}

	/**@description Comprueba si hay un sistema PuréVoice instalado en el servidor actual o no.*/
	systemIsInstalled() {
		return !!(
			this.#documentHandler.isInitialized()
			&& this.#state.guild.channels.cache.get(this.#documentHandler.document.categoryId)
		);
	}

	/**@description Para controlar errores ocasionados por una eliminación prematura de uno de los canales asociados a una sesión.*/
	prematureError = () => warn(chalk.gray('Canal probablemente eliminado prematuramente'));

	/**@description Comprueba si el cambio de estado no es un movimiento entre canales de voz.*/
	isNotConnectionUpdate = () => this.#oldState.channelId === this.#state.channelId;

	/**
	 * @description
	 * Comprueba si el cambio es una desconexión y verifica si el canal quedó vacío para poder eliminar la sesión.
	 * Si la sesión no se elimina, en cambio se le revoca el rol de sesión al miembro que se desconectó.
	 */
	async handleDisconnection() {
		if (this.isNotConnectionUpdate()) return;
		if (!this.#documentHandler.isInitialized()) return;

		const {
			guild,
			channel: oldChannel,
			member,
		} = this.#oldState as VoiceState & { member: GuildMember };
		const pvDocument = this.#documentHandler.document;

		if (!oldChannel) {
			debug(
				'No hubo un canal anterior en proceso de desconexión. Se trata de una conexión pura. Descartando',
			);
			return;
		}

		info(`Desconexión de canal de voz detectada para #${oldChannel.name} (${oldChannel.id})`);

		try {
			const sessionId = pvDocument.sessions.find((sid) => sid === oldChannel.id);
			if (!sessionId) {
				debug('El canal no forma parte del sistema PuréVoice del servidor. Ignorando');
				return;
			}

			const session = await PureVoiceSessionModel.findOne({ channelId: sessionId });
			if (!session) {
				warn(
					`Se encontró la ID de sesión "${sessionId}" en el servidor, pero no se encontró un documento PureVoiceSessionModel acorde a la misma`,
				);
				return;
			}

			const sessionRole = guild.roles.cache.get(session.roleId) as Role;

			//Si la desconexión no es "fatal", simplemente asegurarse que haya un panel de control y quitarle los permisos del mismo al miembro
			if (oldChannel.members.filter((member) => !member.user.bot).size) {
				const result = await requestPVControlPanel(
					guild,
					pvDocument.categoryId,
					pvDocument.controlPanelId,
				);

				if (result.success === true) {
					const controlPannel = result.controlPanel;

					if (result.status === PVCPSuccess.Created)
						pvDocument.controlPanelId = controlPannel.id;

					await controlPannel.permissionOverwrites.delete(member).catch(error);
				}

				member.roles
					.remove(sessionRole, 'Desconexión de miembro de sesión PuréVoice')
					.catch(this.prematureError);
				info('La desconexión no es fatal. Se adaptó el panel de control acordemente');
				return;
			}

			const controlPanel = guild.channels.cache.get(pvDocument.controlPanelId) as TextChannel;

			const pvChannelToRemove = guild.channels.cache.get(session.channelId);
			const pvSessionName = pvChannelToRemove?.name
				? `#${pvChannelToRemove.name} (${session.channelId})`
				: session.channelId;
			const deletionMessage = 'Eliminar componentes de sesión PuréVoice';
			debug(`A punto de eliminar componentes de sesión PuréVoice: ${pvSessionName}...`);

			let success = true;
			const results = await Promise.all([
				pvChannelToRemove?.delete(deletionMessage)?.catch((err) => {
					error(
						new Error(
							`La eliminación del canal de Sesión PuréVoice falló para la sesión: ${pvSessionName}`,
						),
					);
					error(err);
					success = false;
				}),
				controlPanel?.permissionOverwrites
					?.delete(member, deletionMessage)
					?.catch((err) => {
						error(
							new Error(
								`La eliminación de permisos en el Panel de Control PuréVoice falló para la sesión: ${pvSessionName}`,
							),
						);
						error(err);
						success = false;
					}),
				sessionRole?.delete(deletionMessage)?.catch((err) => {
					error(
						new Error(
							`La eliminación del rol de Sesión PuréVoice falló para la sesión: ${pvSessionName}`,
						),
					);
					error(err);
					success = false;
				}),
			]);

			if (!success) {
				warn(
					`No se pudieron eliminar los componentes de la sesión PuréVoice, por lo que los registros permaneceran vivos`,
				);
				return results;
			}

			info(`Se eliminaron los componentes de la sesión PuréVoice: ${pvSessionName}`);
			debug(
				`A punto de eliminar registros restantes de sesión PuréVoice: ${pvSessionName}...`,
			);

			const indexToDelete = pvDocument.sessions.indexOf(oldChannel.id);
			if (indexToDelete >= 0) {
				pvDocument.sessions.splice(indexToDelete, 1);
				pvDocument.markModified('sessions');
			}

			let removed: boolean;
			let reattempts = 3;
			do {
				removed = true;
				await session.deleteOne().catch((err) => {
					removed = false;

					error(
						new Error(
							`La eliminación del registro de Sesión PuréVoice falló para la sesión: #${pvSessionName}`,
						),
					);
					error(err);

					if (reattempts > 0)
						info(`Reintentando eliminación (${reattempts} intentos restantes)...`);
				});
			} while (!removed && reattempts-- > 0);

			if (removed)
				info(
					`Se eliminaron los registros restantes de la sesión PuréVoice: #${pvSessionName}`,
				);
			else
				warn(
					`No se pudieron eliminar los registros restantes de la sesión PuréVoice: #${pvSessionName}`,
				);

			return results;
		} catch (err) {
			error(err);
			if (!guild.systemChannelId)
				return guild.fetchOwner().then((owner) =>
					owner
						.send({
							content: [
								`⚠️ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice de tu servidor **${guild.name}**.`,
								'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
								'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje.',
							].join('\n'),
						})
						.catch(error),
				);

			return guild.systemChannel
				?.send({
					content: [
						'⚠️ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice del servidor.',
						'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
						'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje',
					].join('\n'),
				})
				.catch(error);
		}
	}

	/**
	 * Comprueba si el cambio es una conexión y verifica si el canal al que se conectó es un Canal Automutable PuréVoice o una sesión en curso.
	 * Si es una Canal Automutable, se inicia una nueva sesión en base al miembro que se conectó.
	 * Si es una sesión en curso, se incorpora al miembro a la sesión
	 */
	async handleConnection() {
		if (this.isNotConnectionUpdate()) return;
		if (!this.#documentHandler.isInitialized()) return;

		const { prematureError } = this;
		const { guild, channel, member } = this.#state as VoiceState & { member: GuildMember };
		const pvDocument = this.#documentHandler.document;
		if (!channel || channel?.parentId !== pvDocument.categoryId) return;

		info(`Conexión a canal de voz detectada para #${channel.name} (${channel.id})`);

		//Embed de notificación
		const embed = new EmbedBuilder().setAuthor({
			name: 'PuréVoice',
			iconURL: this.#state.client.user.displayAvatarURL({ size: 128 }),
		});

		if (channel.id !== pvDocument.voiceMakerId) {
			const currentSessionId = pvDocument.sessions.find((sid) => sid === channel.id);
			if (!currentSessionId) {
				debug('El canal no forma parte del sistema PuréVoice del servidor. Ignorando');
				return;
			}

			const currentSession = await PureVoiceSessionModel.findOne({
				channelId: currentSessionId,
			});
			if (!currentSession) {
				warn(
					`Se encontró la ID de sesión "${currentSessionId}" en el servidor, pero no se encontró un documento PureVoiceSessionModel acorde a la misma`,
				);
				return;
			}

			const sessionRole = guild.roles.cache.get(currentSession.roleId);
			if (!sessionRole) {
				warn(
					`Se encontró la ID de sesión "${currentSessionId}" en el servidor, y el documento PureVoiceSessionModel acorde a la misma.`
						+ ` Sin embargo, no se encontró el rol "${currentSession.roleId}" que debía estar relacionado a la sesión`,
				);
				return;
			}

			const translator = member.user.bot
				? new Translator('es')
				: await Translator.from(member);

			const dbMember = currentSession.members.get(member.id);
			const sessionMember = new PureVoiceSessionMember(
				dbMember || {
					id: member.id,
					role: PureVoiceSessionMemberRoles.GUEST,
				},
			);

			if (currentSession.frozen && !sessionMember.isAllowedEvenWhenFreezed()) {
				info(
					`Se desconectó al miembro "${member.user.username}" (${member.id}) del canal de voz de sesión: #${channel.name} (${channel.id}),`
						+ ` debido a que no está autorizado a ingresar al mismo`,
				);
				return member.voice
					.disconnect(
						'Desconexión forzada de usuario que no forma parte de una sesión PuréVoice congelada',
					)
					.catch(prematureError);
			}

			if (sessionMember.isBanned()) {
				info(
					`Se desconectó al miembro "${member.user.username}" (${member.id}) del canal de voz de sesión: #${channel.name} (${channel.id}),`
						+ ` debido a que su entrada al mismo fue explícitamente prohibida por un administrador o moderador de sesión`,
				);
				return member.voice
					.disconnect(
						'Desconexión forzada de usuario no permitido en una sesión PuréVoice',
					)
					.catch(prematureError);
			}

			const controlPanel = guild.channels.cache.get(pvDocument.controlPanelId) as TextChannel;

			await Promise.all([
				member.roles
					.add(sessionRole, translator.getText('voiceSessionReasonMemberAdd'))
					.catch(prematureError),
				!sessionMember.isGuest()
					&& controlPanel?.permissionOverwrites
						.edit(member, { ViewChannel: true })
						.catch(prematureError),
			]);

			if (dbMember) return;

			info(
				`Dará lugar el registro de un nuevo miembro de sesión: "${member.user.username}" (${member.id}), para la sesión del canal: #${channel.name} (${channel.id})`,
			);

			const userConfigs =
				(await UserConfigModel.findOne({ userId: member.id }))
				|| new UserConfigModel({ userId: member.id });

			embed
				.setColor(0x00ff7f)
				.setFooter({ text: `👥 ${currentSession.members.size}` })
				.addFields({
					name: `${member.user.bot ? '🤖' : '👤'} ${translator.getText('voiceSessionNewMemberName')}`,
					value: translator.getText(
						member.user.bot
							? 'voiceSessionNewMemberValueBotAttached'
							: 'voiceSessionNewMemberValueMemberIntegrated',
						`${member}`,
					),
				});

			await channel
				?.send({
					content:
						userConfigs.voice.ping !== 'always' || member.user.bot
							? undefined
							: translator.getText('voiceSessionNewMemberContentHint', `${member}`),
					embeds: [embed],
				})
				.catch(prematureError);
			currentSession.members.set(member.id, sessionMember.toJSON());
			currentSession.markModified('members');
			await currentSession.save();
			return;
		}

		try {
			const [userConfigs, translator] = await Promise.all([
				(await UserConfigModel.findOne({ userId: member.id }))
					|| new UserConfigModel({ userId: member.id }),
				member.user.bot ? new Translator('es') : await Translator.from(member),
			]);

			const prepareSessionRole = async () => {
				const defaultName = member.user.username.slice(0, 24);
				const sessionRole = await guild.roles.create({
					name:
						makeSessionRoleAutoname(userConfigs as UserConfigSchemaType)
						?? `🔶 PV ${defaultName}`,
					colors: {
						primaryColor: tenshiColor,
					},
					mentionable: true,
					reason: translator.getText('voiceSessionReasonRoleCreate'),
				});

				await member.roles
					.add(sessionRole, translator.getText('voiceSessionReasonFirstMemberAdd'))
					.catch(prematureError);
				await channel?.permissionOverwrites
					?.edit(
						sessionRole,
						{ SendMessages: true },
						{ reason: translator.getText('voiceSessionReasonRoleEdit') },
					)
					.catch(prematureError);

				return sessionRole;
			};

			const prepareSessionMakerChannel = async () => {
				const sessionMakerChannel = await guild.channels.create({
					name: '➕',
					type: ChannelType.GuildVoice,
					parent: pvDocument.categoryId,
					bitrate: 64e3,
					userLimit: 1,
					reason: translator.getText('voiceSessionReasonChannelCreate'),
				});

				await sessionMakerChannel.lockPermissions().catch(prematureError);
				await sessionMakerChannel.permissionOverwrites
					.edit(guild.roles.everyone, { SendMessages: false })
					.catch(prematureError);
				await sessionMakerChannel.permissionOverwrites
					.edit(guild.members.me as GuildMember, { SendMessages: true })
					.catch(prematureError);

				return sessionMakerChannel;
			};

			const prepareControlPanel = async () => {
				let controlPanel = guild.channels.cache.get(
					pvDocument.controlPanelId,
				) as TextChannel;

				if (controlPanel) {
					await controlPanel.permissionOverwrites
						.edit(member, { ViewChannel: true })
						.catch(prematureError);
					return controlPanel;
				}

				const result = await createPVControlPanelChannel(guild, pvDocument.categoryId);

				if (result.success) {
					controlPanel = result.controlPanel;
					pvDocument.controlPanelId = controlPanel.id;
					await controlPanel.permissionOverwrites
						.edit(member, { ViewChannel: true })
						.catch(prematureError);
				}

				return controlPanel;
			};

			const prepareSessionChannel = async () => {
				if (!channel) return;
				await channel
					.setName(makeSessionAutoname(userConfigs) ?? '🔶')
					.catch(prematureError);
				await channel.setUserLimit(0).catch(prematureError);
				return channel;
			};

			const [sessionRole, newSession] = await Promise.all([
				prepareSessionRole(),
				prepareSessionMakerChannel(),
				prepareControlPanel(),
				prepareSessionChannel(),
			]);

			pvDocument.voiceMakerId = newSession.id;
			pvDocument.sessions.push(channel.id);
			pvDocument.markModified('sessions');

			await PureVoiceSessionModel.create({
				channelId: channel.id,
				roleId: sessionRole.id,
				adminId: member.id,
				members: new Map().set(
					member.id,
					new PureVoiceSessionMember({
						id: member.id,
						role: PureVoiceSessionMemberRoles.ADMIN,
					}).toJSON(),
				),
				killDelaySeconds: 0, //PENDIENTE: UserConfig
			});

			embed
				.setColor(0x21abcd)
				.setTitle(translator.getText('voiceSessionNewSessionTitle'))
				.setFooter({ text: `👥 1` })
				.addFields(
					{
						name: translator.getText('voiceSessionNewSessionCustomizeName'),
						value: translator.getText(
							'voiceSessionNewSessionCustomizeValue',
							p_pure(guild.id).raw,
						),
					},

					{
						name: translator.getText('voiceSessionNewSessionNamingName'),
						value: translator.getText(
							'voiceSessionNewSessionNamingValue',
							p_pure(guild.id).raw,
						),
						inline: true,
					},
					{
						name: translator.getText('voiceSessionNewSessionEmoteName'),
						value: translator.getText('voiceSessionNewSessionEmoteValue'),
						inline: true,
					},

					{
						name: translator.getText('voiceSessionNewSessionRoleName'),
						value: translator.getText(
							'voiceSessionNewSessionRoleValue',
							`${sessionRole}`,
						),
					},

					{
						name: translator.getText('voiceSessionNewSessionRenameName'),
						value: translator.getText('voiceSessionNewSessionRenameValue'),
						inline: true,
					},
				);

			userConfigs.voice.autoname
				|| embed.addFields({
					name: translator.getText('voiceSessionNewSessionAutonameName'),
					value: translator.getText('voiceSessionNewSessionAutonameValue'),
					inline: true,
				});

			const startMessage: string | MessagePayload | MessageCreateOptions = {
				embeds: [embed],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder({
							customId: 'voz_showMeHow',
							label: translator.getText('buttonShowMeHow'),
							style: ButtonStyle.Primary,
							emoji: '📖',
						}),
					),
				],
			};

			if (userConfigs.voice.ping !== 'never')
				startMessage.content = translator.getText(
					'voiceSessionNewMemberContentHint',
					member,
				);

			await channel.send(startMessage).catch(prematureError);

			userConfigs.voice.autoname
				|| setTimeout(async () => {
					const pvDocument = await this.#documentHandler.relinkDocument();
					if (!pvDocument) return;

					const sessionId = pvDocument.sessions.find((sid) => sid === channel.id);
					if (!sessionId) return;

					const session = await PureVoiceSessionModel.findOne({ channelId: sessionId });
					if (!session || session.nameChanged) return;

					session.nameChanged = new Date(Date.now());

					const name = member.user.username.slice(0, 24);
					const namingReason = translator.getText('voiceSessionReasonChannelForceName');
					return Promise.all([
						session.save(),
						channel?.send({
							content: '🔹 Se asignó un nombre a la sesión automáticamente',
						}),
						channel?.setName(`💠【${name}】`, namingReason),
						sessionRole?.setName(`💠 ${name}`, namingReason),
					]).catch(error);
				}, 60e3 * 3);
		} catch (err) {
			error(err);
			if (!guild.systemChannelId)
				return guild.fetchOwner().then((owner) =>
					owner.send({
						content: [
							`⚠️ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice de tu servidor **${guild.name}**. Esto puede deberse a una saturación de acciones o a falta de permisos.`,
							'Si el problema persiste, desinstala y vuelve a instalar el Sistema',
						].join('\n'),
					}),
				);
			return guild.systemChannel?.send({
				content: [
					'⚠️ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice del servidor. Esto puede deberse a una saturación de acciones o a falta de permisos.',
					'Si el problema persiste, prueben desinstalar y volver a instalar el Sistema',
					'Si lo ven necesario, ¡menciónenle el asunto a un moderador!',
				].join('\n'),
			});
		}
	}

	/**
	 * Comprobar si hay sesiones en la base de datos que no corresponden a ningún canal existente, y eliminarlas
	 * @returns la cantidad de sesiones defectuosas eliminadas
	 */
	async checkFaultySessions(): Promise<number> {
		if (!this.#documentHandler.isInitialized()) return 0;

		const pvDocument = this.#documentHandler.document;
		const guildChannels = this.#state.guild.channels.cache;
		const members = new Map<string, GuildMember>();
		const invalidSessionIds: string[] = [];

		pvDocument.sessions = pvDocument.sessions.filter((sid) => {
			const channelExists = guildChannels.has(sid);

			if (!channelExists) {
				this.#state.guild.members.cache.forEach((member, memberId) =>
					members.set(memberId, member),
				);
				invalidSessionIds.push(sid);
			}

			return channelExists;
		});

		const controlPanel = guildChannels.get(pvDocument.controlPanelId) as TextChannel;

		for (const [, member] of members)
			await controlPanel.permissionOverwrites.delete(
				member,
				'PLACEHOLDER_REASON_PV_CLEANUP_VIEWCHANNEL_DISABLE',
			);

		if (invalidSessionIds.length) {
			await PureVoiceSessionModel.deleteMany({ channelId: { $in: invalidSessionIds } });
			pvDocument.markModified('sessions');
		}

		return invalidSessionIds.length;
	}

	async fetchGuildDocument(guildId: string) {
		await this.#documentHandler.fetchSystemDocument({ guildId });
	}

	async saveChanges() {
		await this.#documentHandler.saveChanges();
	}
}

type ActionFn = (documentHandler: PureVoiceDocumentHandler) => Promise<unknown>;

export class PureVoiceActionHandler {
	#documentHandler: PureVoiceDocumentHandler;
	#actionFn: ActionFn;
	#guild: Guild;

	constructor(guild: Guild, actionHandler: ActionFn) {
		this.#documentHandler = new PureVoiceDocumentHandler();
		this.#actionFn = actionHandler;
		this.#guild = guild;
	}

	/** Comprueba si hay un sistema PuréVoice instalado en el servidor actual o no */
	systemIsInstalled() {
		return !!(
			this.#documentHandler.document
			&& this.#guild.channels.cache.get(this.#documentHandler.document.categoryId)
		);
	}

	async performAction() {
		await this.#actionFn(this.#documentHandler);
	}

	async fetchSystemDocument() {
		await this.#documentHandler.fetchSystemDocument({ guildId: this.#guild.id });
	}

	async saveChanges() {
		await this.#documentHandler.saveChanges();
	}
}

/**@class Representa un orquestador de sistema PuréVoice*/
export class PureVoiceOrchestrator {
	#guildId: string;
	#updates: PureVoiceUpdateHandler[];
	#actions: PureVoiceActionHandler[];
	#busy: boolean;

	/**
	 * @description
	 * Instancia un orquestador de sistema PuréVoice para el servidor especificado
	 */
	constructor(guildId: string) {
		this.#guildId = guildId;
		this.#updates = [];
		this.#actions = [];
		this.#busy = false;
	}

	/**
	 * @description
	 * Pone en cola un análisis de cambio de estado de una sesión de voz
	 */
	async orchestrateUpdate(handler: PureVoiceUpdateHandler) {
		this.#updates.push(handler);

		if (this.#busy) return true;
		this.#busy = true;

		await this.#consumeUpdate();

		return false;
	}

	/**
	 * @description
	 * Pone en cola prioritaria una ejecución de acción en una sesión de voz
	 */
	async orchestrateAction(handler: PureVoiceActionHandler) {
		this.#actions.push(handler);

		if (this.#busy) return true;
		this.#busy = true;

		await this.#consumeAction();

		return false;
	}

	/**
	 * @description
	 * Quita de la cola un análisis de cambio de estado de una sesión de voz y lo ejecuta. Si alguna cola no está vacía, se ejecuta consumeAction (prioridad) o consumeUpdate.
	 */
	async #consumeUpdate() {
		const handler = this.#updates.shift();
		await handler?.fetchGuildDocument(this.#guildId).catch(error);
		if (!handler?.systemIsInstalled()) return;

		try {
			await Promise.all([
				handler.checkFaultySessions(),
				handler.handleDisconnection(),
				handler.handleConnection(),
			]);
			await handler.saveChanges();
		} catch (err) {
			error(
				err,
				'Ocurrió un error mientras se analizaba un cambio de estado en una sesión Purévoice',
			);
		}

		if (this.#actions.length) {
			await this.#consumeAction();
			return;
		}

		if (this.#updates.length) {
			await this.#consumeUpdate();
			return;
		}

		this.#busy = false;
		return;
	}

	/**
	 * @description
	 * Quita de la cola una ejecución de acción en una sesión de voz y la ejecuta. Si alguna cola no está vacía, se ejecuta consumeAction (prioridad) o consumeUpdate.
	 */
	async #consumeAction() {
		const handler = this.#actions.shift();
		await handler?.fetchSystemDocument().catch(error);
		if (!handler?.systemIsInstalled()) return;

		try {
			await handler.performAction().catch(error);
			await handler.saveChanges();
		} catch (err) {
			error(err, 'Ocurrió un error mientras se procesaba una acción en una sesión Purévoice');
		}

		if (this.#actions.length) {
			await this.#consumeAction();
			return;
		}

		if (this.#updates.length) {
			await this.#consumeUpdate();
			return;
		}

		this.#busy = false;
		return;
	}
}

export const PureVoiceSessionMemberRoles = {
	GUEST: 0,
	MOD: 1,
	ADMIN: 2,
} as const;

export type PureVoiceSessionMemberRole = ValuesOf<typeof PureVoiceSessionMemberRoles>;

export interface PureVoiceSessionMemberJSONBody {
	id: string;
	role: PureVoiceSessionMemberRole;
	whitelisted: boolean;
	banned: boolean;
}

export class PureVoiceSessionMember {
	id: string;
	role: PureVoiceSessionMemberRole;
	#whitelisted: boolean;
	#banned: boolean;

	constructor(
		data: Pick<PureVoiceSessionMemberJSONBody, 'id'> &
			Partial<Omit<PureVoiceSessionMemberJSONBody, 'id'>>,
	) {
		this.id = data.id;
		this.role = data?.role ?? PureVoiceSessionMemberRoles.GUEST;
		this.#whitelisted = !!(data?.whitelisted ?? false);
		this.#banned = !!(data?.banned ?? false);
	}

	exchangeAdmin(other: PureVoiceSessionMember) {
		if (this.role === other.role || !this.isAdmin()) return false;

		const tempRole = other.role;
		other.role = this.role;
		this.role = tempRole;

		return true;
	}

	giveMod(other: PureVoiceSessionMember) {
		if (!this.isAdmin() || !other.isGuest()) return false;

		other.role = PureVoiceSessionMemberRoles.MOD;
		return true;
	}

	revokeMod(other: PureVoiceSessionMember) {
		if (!this.isAdmin() || !other.isMod()) return false;

		other.role = PureVoiceSessionMemberRoles.GUEST;
		return true;
	}

	setWhitelisted(whitelist: boolean) {
		this.#whitelisted = !!whitelist;
		return this;
	}

	setBanned(ban: boolean) {
		this.#banned = !!ban;
		return this;
	}

	isGuest() {
		return this.role === PureVoiceSessionMemberRoles.GUEST;
	}

	isMod() {
		return this.role === PureVoiceSessionMemberRoles.MOD;
	}

	isAdmin() {
		return this.role === PureVoiceSessionMemberRoles.ADMIN;
	}

	isAllowed() {
		return !this.isBanned();
	}

	isAllowedEvenWhenFreezed() {
		if (this.isBanned()) return false;

		return this.isAdmin() || this.isMod() || this.#whitelisted;
	}

	isBanned() {
		return this.isGuest() && this.#banned;
	}

	toJSON(): PureVoiceSessionMemberJSONBody {
		return {
			id: this.id,
			role: this.role,
			banned: this.#banned,
			whitelisted: this.#whitelisted,
		};
	}
}

export const PVCPFailure = {
	InvalidParams: 'InvalidParams',
	NoChannel: 'NoChannel',
	NoCategory: 'NoCategory',
	NoPermissions: 'NoPermissions',
	Unknown: 'Unknown',
} as const;
export const PVCPSuccess = {
	Created: 'Created',
	Fetched: 'Fetched',
} as const;
type PVCPFailureState = ValuesOf<typeof PVCPFailure>;
type PVCPSuccessState = ValuesOf<typeof PVCPSuccess>;

interface BasePVControlPanelResult<TSuccess extends boolean> {
	success: TSuccess;
}
interface PVCPFailureResultData {
	status: PVCPFailureState;
}

type PVControlPanelFailResult = BasePVControlPanelResult<false> & PVCPFailureResultData;
interface PVCPSuccessResultData {
	status: PVCPSuccessState;
	controlPanel: TextChannel;
}

type PVControlPanelSuccessResult = BasePVControlPanelResult<true> & PVCPSuccessResultData;
type PVControlPanelResult = PVControlPanelFailResult | PVControlPanelSuccessResult;

export async function createPVControlPanelChannel(
	guild: Guild,
	categoryId: string,
): Promise<PVControlPanelResult> {
	debug(
		'A control panel creation request for category',
		categoryId,
		'has begun. Checking basic requirements to create...',
	);

	if (!(guild instanceof Guild) || typeof categoryId !== 'string') {
		warn('Malformed parameters in createPVControlPanelChannel:', { guild, categoryId });
		return { success: false, status: PVCPFailure.InvalidParams };
	}

	let categoryChannel = guild.channels.cache.get(categoryId);

	if (!categoryChannel) {
		warn("Couldn't resolve category channel from id:", categoryId);
		return { success: false, status: PVCPFailure.NoChannel };
	}

	if (categoryChannel.type !== ChannelType.GuildCategory) {
		warn('Supplied channel ID does not correspond to a category channel:', categoryId);
		return { success: false, status: PVCPFailure.NoCategory };
	}

	if (!guild.members.me?.permissions.has('ManageChannels', true)) {
		info('Unable to create channel because of missing permissions in guild:', guild.name);
		return { success: false, status: PVCPFailure.NoPermissions };
	}

	debug('All checks passed for control panel creation in:', categoryId);

	debug('Fetching category channel.');
	categoryChannel = await categoryChannel.fetch(true);

	debug('Attempting to create new control panel channel...');
	/**@type {TextChannel}*/
	let controlPanelChannel: TextChannel;
	try {
		controlPanelChannel = await guild.channels.create({
			type: ChannelType.GuildText,
			parent: categoryChannel,
			name: '💻〖𝓟𝓥〗',
			position: 999,
			permissionOverwrites: [
				{ id: guild.roles.everyone, deny: ['ViewChannel', 'SendMessages'] },
				{ id: guild.members.me, allow: ['ViewChannel', 'SendMessages'] },
			],
			reason: 'Crear Panel de Control PuréVoice',
		});
	} catch (err) {
		error(err);
		return {
			success: false,
			status: PVCPFailure.Unknown,
		};
	}

	const controlPanelEmbed = new EmbedBuilder()
		.setColor(tenshiColor)
		.setAuthor({ name: 'Bot de Puré • PuréVoice', url: 'https://i.imgur.com/P9eeVWC.png' })
		.addFields(
			{
				name: `${getBotEmoji('langEs')} Panel de Control`,
				value: 'Configura una sesión aquí',
				inline: true,
			},
			{
				name: `${getBotEmoji('langEn')} Control Panel`,
				value: 'Configure a session here',
				inline: true,
			},
			{
				name: `${getBotEmoji('langJa')} コントロールパネル`,
				value: 'ここでセッションを設定',
				inline: true,
			},
		);

	const controlPanelButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId('voz_setSessionName')
			.setEmoji(getBotEmojiResolvable('pencilWhite'))
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId('voz_editSessionMembers')
			.setEmoji(getBotEmojiResolvable('userWhite'))
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId('voz_editSessionKillDelay')
			.setEmoji(getBotEmojiResolvable('timerWhite'))
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId('voz_freezeSession')
			.setEmoji(getBotEmojiResolvable('freezeWhite'))
			.setStyle(ButtonStyle.Danger),
	);

	debug('Sending menu to control panel.');
	try {
		await controlPanelChannel.send({
			embeds: [controlPanelEmbed],
			components: [controlPanelButtons],
		});
	} catch (err) {
		error(err);
		return {
			success: false,
			status: PVCPFailure.Unknown,
		};
	}

	info('Created a new control panel for category:', categoryId);

	return {
		success: true,
		status: PVCPSuccess.Created,
		controlPanel: controlPanelChannel,
	};
}

export async function requestPVControlPanel(
	guild: Guild,
	categoryId: string,
	controlPanelId: string,
): Promise<PVControlPanelResult> {
	debug('Processing request for control panel:', controlPanelId, 'in category:', categoryId);

	const existingControlPanel = (guild.channels.cache.get(controlPanelId)
		?? (await guild.channels.fetch(controlPanelId).catch(() => undefined))) as TextChannel;

	if (existingControlPanel) {
		debug('Fetched existing control panel.');
		return {
			success: true,
			status: PVCPSuccess.Fetched,
			controlPanel: existingControlPanel,
		};
	}

	return createPVControlPanelChannel(guild, categoryId);
}

export function getFrozenSessionAllowedMembers(
	voiceChannel: VoiceBasedChannel,
	dbMembers: Map<
		string,
		Pick<PureVoiceSessionMemberJSONBody, 'id'> &
			Partial<Omit<PureVoiceSessionMemberJSONBody, 'id'>>
	>,
) {
	const voiceMembers = voiceChannel.members;

	const allowedSessionMembers: Map<string, PureVoiceSessionMember> = new Map();

	for (const [id, dbMember] of dbMembers) {
		const sessionMember = new PureVoiceSessionMember(dbMember);
		if (sessionMember.isAllowedEvenWhenFreezed() || voiceMembers.has(dbMember.id))
			allowedSessionMembers.set(id, sessionMember);
	}

	return allowedSessionMembers;
}

const orchestrators: Map<string, PureVoiceOrchestrator> = new Map();

/**
 * @description
 * Obtiene el orquestador de el servidor indicado.
 * Si el servidor aun no tiene un orquestador instanciado, se lo instancia automáticamente.
 */
export function getOrchestrator(guildId: string) {
	const orchestrator = orchestrators.get(guildId) || new PureVoiceOrchestrator(guildId);

	if (!orchestrators.has(guildId)) orchestrators.set(guildId, orchestrator);

	return orchestrator;
}
