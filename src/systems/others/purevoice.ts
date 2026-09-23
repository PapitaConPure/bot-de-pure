'use strict';

import chalk from 'chalk';
import { addMilliseconds, differenceInMilliseconds, getUnixTime } from 'date-fns';
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
	ContainerBuilder,
	EmbedBuilder,
	Guild,
	MessageFlags,
	OverwriteType,
	SeparatorSpacingSize,
} from 'discord.js';
import type { ValuesOf } from 'types';
import { ClientNotFoundError, client } from '@/core/client';
import { tenshiAltColor, tenshiColor, tenshiPeachColor } from '@/data/globalProps.js';
import { Translator } from '@/i18n/index.js';
import type { PureVoiceDocument, PureVoiceSessionDocument } from '@/models/purevoice.js';
import { PureVoiceModel, PureVoiceSessionModel } from '@/models/purevoice.js';
import type { UserConfigSchemaType } from '@/models/userconfigs.js';
import UserConfigModel from '@/models/userconfigs.js';
import { fetchGuild, fetchMember } from '@/utils/discord';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import Logger from '@/utils/logs.js';
import { p_pure } from '@/utils/prefixes';
import { attemptManyTimes } from '@/utils/promises';

const { debug, info, warn, error, fatal } = Logger('DEBUG', 'PV');

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

		const { guild, channel: oldChannel, member } = this.#oldState;
		const pvDocument = this.#documentHandler.document;

		if (!oldChannel) {
			debug('Disconnection event had no previous channel. Discarding.');
			return;
		}

		if (!member) {
			debug('Disconnection event had no previous member. Discarding.');
			return;
		}

		info(`Voice channel disconnection detected: #${oldChannel.name} (${oldChannel.id})`);

		try {
			const sessionId = pvDocument.sessions.find((sid) => sid === oldChannel.id);
			if (!sessionId) {
				debug("The channel is not part of this guild's PuréVoice system. Ignoring.");
				return;
			}

			const session = await PureVoiceSessionModel.findOne({ channelId: sessionId });
			if (!session) {
				warn(
					`Found session ID "${sessionId}" within guild document, but couldn't find the related PureVoiceSessionModel document.`,
				);
				return;
			}

			const sessionRole = guild.roles.cache.get(session.roleId) as Role;

			/**Cleans up the member's session permissions. Makes sure a control pannel exists and creates one if it doesn't.*/
			const disconnectMember = async () => {
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
			};

			if (oldChannel.members.filter((member) => !member.user.bot).size) {
				await disconnectMember();
				info('Session is still populated after disconnection. Control panel updated.');
				return;
			}

			info('Session was abandoned after disconnection. Beginning deletion procedure.');
			const userConfigs =
				(await UserConfigModel.findOne({ userId: session.adminId }))
				|| new UserConfigModel({ userId: session.adminId });

			const destroySessionAndUpdate = (
				pvDocument: PureVoiceDocument,
				session: PureVoiceSessionDocument,
				guild: Guild,
			) => {
				const pvChannelToRemove = guild.channels.cache.get(session.channelId);
				const pvSessionName = pvChannelToRemove?.name
					? `#${pvChannelToRemove.name} (${session.channelId})`
					: session.channelId;
				const controlPanel = guild.channels.cache.get(
					pvDocument.controlPanelId,
				) as TextChannel;

				return Promise.all([
					destroySession(pvDocument, session, guild),
					controlPanel?.permissionOverwrites
						.delete(member, 'Eliminar componentes de sesión PuréVoice')
						.catch((err) => {
							error(
								new Error(
									`Couldn't remove control panel member permissions for session: ${pvSessionName}`,
								),
							);
							error(err);
						}),
				]);
			};

			const killDelayMs = session.killDelayMs ?? userConfigs.voice.killDelay ?? 0;
			if (killDelayMs === 0) return destroySessionAndUpdate(pvDocument, session, guild);

			await disconnectMember();

			const now = new Date(Date.now());
			const killAt = addMilliseconds(now, killDelayMs);
			const orchestrator = getOrchestrator(guild.id);
			orchestrator.scheduleAction(
				`kill-${sessionId}`,
				new PureVoiceActionHandler(guild, async (documentHandler) => {
					if (oldChannel.members.filter((member) => !member.user.bot).size) return;

					const session = await PureVoiceSessionModel.findOne({ channelId: sessionId });
					if (!session) {
						warn(
							`Found session ID "${sessionId}" within guild document, but couldn't find the related PureVoiceSessionModel document.`,
						);
						return;
					}

					return destroySessionAndUpdate(documentHandler.document, session, guild);
				}),
				killDelayMs,
			);
			session.lastActiveAt = now;
			await session.save();

			const admin = fetchMember(session.adminId, { guild });
			const adminMention =
				userConfigs.voice.ping === 'always' ? `${admin}` : admin?.displayName;

			return oldChannel.send({
				flags: MessageFlags.IsComponentsV2,
				components: [
					new ContainerBuilder()
						.setAccentColor(tenshiPeachColor)
						.addTextDisplayComponents(
							(textDisplay) => textDisplay.setContent('## Eliminación pendiente'),
							(textDisplay) =>
								textDisplay.setContent(
									[
										`Esta sesión está vacía y será eliminada <t:${getUnixTime(killAt)}:R> (<t:${getUnixTime(killAt)}:F>) a obediencia de la configuración de su administrador (${adminMention}).`,
										'La eliminación será cancelada si alguien permitido entra a la sesión.',
									].join('\n'),
								),
						),
				],
			});
		} catch (err) {
			error(err);

			const errReply = {
				content: [
					`⚠️ Ocurrió un problema al procesar una desconexión de sesión del Sistema PuréVoice en **${guild.name}**.`,
					'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
					'Si no notas canales de sesión muertos, puedes ignorar este mensaje.',
				].join('\n'),
			};

			if (!guild.systemChannelId)
				return guild.fetchOwner().then((owner) => owner.send(errReply).catch(error));

			return guild.systemChannel?.send(errReply).catch(error);
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

			//Connection to existing session
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
				: await Translator.fromUser(member);

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

			const scheduleId = `kill-${currentSessionId}`;
			const orchestrator = getOrchestrator(guild.id);
			if (orchestrator.hasScheduledAction(scheduleId)) {
				debug('Cancelling orchestrated kill action.');
				orchestrator.cancelScheduledAction(scheduleId);

				await channel.send({
					flags: MessageFlags.IsComponentsV2,
					components: [
						new ContainerBuilder()
							.setAccentColor(tenshiAltColor)
							.addTextDisplayComponents(
								(textDisplay) => textDisplay.setContent('## Eliminación cancelada'),
								(textDisplay) =>
									textDisplay.setContent(
										[
											'La eliminación previamente programada de esta sesión fue cancelada porque alguien permitido entró a la misma.',
										].join('\n'),
									),
							),
					],
				});
			}

			await Promise.all([
				member.roles
					.add(sessionRole, translator.getText('voiceSessionReasonMemberAdd'))
					.catch(prematureError),
				!sessionMember.isGuest()
					&& (async () => {
						const pvcpResult = await requestPVControlPanel(
							guild,
							pvDocument.categoryId,
							pvDocument.controlPanelId,
						);
						if (!pvcpResult.success) return;

						return pvcpResult.controlPanel.permissionOverwrites.edit(member, {
							ViewChannel: true,
						});
					})().catch(prematureError),
			]);

			if (dbMember) return;

			info(
				`A new session member: "${member.user.username}" (${member.id}), will be registered for session of channel: #${channel.name} (${channel.id})`,
			);

			currentSession.members.set(member.id, sessionMember.toJSON());
			currentSession.markModified('members');
			await currentSession.save();

			const userConfigs =
				(await UserConfigModel.findOne({ userId: member.id }))
				|| new UserConfigModel({ userId: member.id });

			embed
				.setColor(tenshiColor)
				.setFooter({ text: `👥 ${channel.members.size}/${currentSession.members.size}` })
				.addFields({
					name: `${member.user.bot ? '🤖' : '👤'} ${translator.getText('voiceSessionNewMemberName')}`,
					value: translator.getText(
						member.user.bot
							? 'voiceSessionNewMemberValueBotAttached'
							: 'voiceSessionNewMemberValueMemberIntegrated',
						`${member}`,
					),
				});

			const content =
				userConfigs.voice.ping !== 'always' || member.user.bot
					? undefined
					: translator.getText('voiceSessionNewMemberContentHint', `${member}`);

			channel.send({ content, embeds: [embed] }).catch(prematureError);

			return;
		}

		//Create a new session
		try {
			const [userConfigs, translator] = await Promise.all([
				(await UserConfigModel.findOne({ userId: member.id }))
					|| new UserConfigModel({ userId: member.id }),
				member.user.bot ? new Translator('es') : await Translator.fromUser(member),
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
				killDelayMs: userConfigs.voice.killDelay ?? undefined,
			});

			embed
				.setColor(tenshiColor)
				.setTitle(translator.getText('voiceSessionNewSessionTitle'))
				.setFooter({ text: `👥 1/1` })
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
					if (!session || session.nameChangedAt) return;

					session.nameChangedAt = new Date(Date.now());

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

type PureVoiceActionFn = (documentHandler: PureVoiceDocumentHandler) => Promise<unknown>;

export class PureVoiceActionHandler {
	#documentHandler: PureVoiceDocumentHandler;
	#actionFn: PureVoiceActionFn;
	#guild: Guild;

	constructor(guild: Guild, actionHandler: PureVoiceActionFn) {
		this.#documentHandler = new PureVoiceDocumentHandler();
		this.#actionFn = actionHandler;
		this.#guild = guild;
	}

	/** Comprueba si hay un sistema PuréVoice instalado en el servidor actual o no */
	systemIsInstalled() {
		return !!(
			this.#documentHandler.isInitialized()
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
	#actionTimeouts: Map<string, ReturnType<typeof setTimeout>>;

	/**
	 * @description
	 * Instancia un orquestador de sistema PuréVoice para el servidor especificado
	 */
	constructor(guildId: string) {
		this.#guildId = guildId;
		this.#updates = [];
		this.#actions = [];
		this.#busy = false;
		this.#actionTimeouts = new Map();
	}

	/**
	 * @description
	 * Pone en cola un análisis de cambio de estado de una sesión de voz.
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
	 * Pone en cola prioritaria una ejecución de acción en una sesión de voz.
	 */
	async orchestrateAction(handler: PureVoiceActionHandler) {
		this.#actions.push(handler);

		if (this.#busy) return true;
		this.#busy = true;

		await this.#consumeAction();

		return false;
	}

	/**Performs a cleanup check task for the PuréVoice system associated to this orchestrator.*/
	async check() {
		const guild = await fetchGuild(this.#guildId);
		if (!guild)
			return fatal(
				new Error("Guild associated to an orchestrator didn't exist during check."),
			);

		const handler = new PureVoiceActionHandler(guild, async (documentHandler) => {
			const pvDocument = documentHandler.document;

			const pvChannel = guild.channels.cache.get(pvDocument.controlPanelId);
			const sessions = await PureVoiceSessionModel.find({ channelId: pvDocument.sessions });
			const sessionsMap = new Map<string, PureVoiceSessionDocument>(
				sessions.map((session) => [session.channelId, session]),
			);

			await fetchGuildMembers(guild);

			return Promise.allSettled([
				pvChannel?.isTextBased()
					&& !pvChannel.isThread()
					&& pvChannel.permissionOverwrites.cache.map(async (overwrite) => {
						if (overwrite.type === OverwriteType.Role) return;

						const memberId = overwrite.id;
						const member = guild.members.cache.get(memberId);

						const memberChannelId = member?.voice?.channelId;
						if (!memberChannelId) return overwrite.delete();

						const session = sessionsMap.get(memberChannelId);
						if (!session) return overwrite.delete();

						const dbMember = session.members.get(member.id);
						if (!dbMember) return overwrite.delete();

						const sessionMember = new PureVoiceSessionMember(dbMember);
						if (sessionMember.isGuest()) return overwrite.delete();

						return overwrite.edit({ ViewChannel: true });
					}),
				...sessions.map(async (session) => {
					const sessionId = session.channelId;
					const channel = guild.channels.cache.get(sessionId);
					if (!channel?.isVoiceBased()) {
						pvDocument.removeFromSessionsList(sessionId);
						return session.deleteOne();
					}

					if (channel.members.filter((member) => !member.user.bot).size > 0) return;

					const adminUserConfigs = await UserConfigModel.findOne({
						userId: session.adminId,
					});

					const rawKillDelayMs =
						session.killDelayMs ?? adminUserConfigs?.voice.killDelay ?? 0;
					if (rawKillDelayMs <= 0) return destroySession(pvDocument, session, guild);

					const then = session.lastActiveAt ?? new Date(Date.now());
					const killAt = addMilliseconds(then, rawKillDelayMs);
					const killDelayMs = differenceInMilliseconds(killAt, Date.now());
					if (killDelayMs <= 0) return destroySession(pvDocument, session, guild);

					const orchestrator = getOrchestrator(guild.id);
					orchestrator.scheduleAction(
						`kill-${sessionId}`,
						new PureVoiceActionHandler(guild, async (documentHandler) => {
							const channel = guild.channels.cache.get(sessionId);
							if (
								!channel?.isVoiceBased()
								|| channel.members.filter((member) => !member.user.bot).size
							)
								return;

							const session = await PureVoiceSessionModel.findOne({
								channelId: sessionId,
							});
							if (!session) {
								warn(
									`Found session ID "${sessionId}" within guild document, but couldn't find the related PureVoiceSessionModel document.`,
								);
								return;
							}

							return destroySession(documentHandler.document, session, guild);
						}),
						killDelayMs,
					);

					const admin = fetchMember(session.adminId, { guild });
					const adminMention =
						adminUserConfigs?.voice.ping === 'always' ? `${admin}` : admin?.displayName;

					return channel.send({
						flags: MessageFlags.IsComponentsV2,
						components: [
							new ContainerBuilder()
								.setAccentColor(tenshiPeachColor)
								.addTextDisplayComponents(
									(textDisplay) =>
										textDisplay.setContent('## Eliminación pendiente'),
									(textDisplay) =>
										textDisplay.setContent(
											[
												`Esta sesión está vacía y será eliminada en <t:${getUnixTime(killAt)}:R> (<t:${getUnixTime(killAt)}:F>) a obediencia de la configuración de su administrador (${adminMention}).`,
												'La eliminación será cancelada si alguien permitido entra a la sesión.',
											].join('\n'),
										),
								),
						],
					});
				}),
			]);
		});

		this.orchestrateAction(handler);
	}

	async checkMemberPermissions(
		member: GuildMember,
		sessionMember: PureVoiceSessionMember,
		voiceChannel: VoiceBasedChannel,
	) {
		const guild = member.guild;

		const actionHandler = new PureVoiceActionHandler(guild, async (documentHandler) => {
			const pvDocument = documentHandler.document;
			const result = await requestPVControlPanel(
				guild,
				pvDocument.categoryId,
				pvDocument.controlPanelId,
			);

			if (!result.success) return;

			const { status, controlPanel } = result;

			if (status === PVCPSuccess.Created) pvDocument.controlPanelId = controlPanel.id;

			const isBanned = sessionMember.isBanned();
			await Promise.all([
				isBanned || sessionMember.isGuest()
					? controlPanel.permissionOverwrites
							.delete(
								member,
								'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_DISABLE',
							)
							.catch(console.error)
					: controlPanel.permissionOverwrites
							.edit(
								member,
								{ ViewChannel: true },
								{
									reason: 'PLACEHOLDER_PV_REASON_MEMBERSCHANGED_VIEWCHANNEL_ENABLE',
								},
							)
							.catch(console.error),
				isBanned
					? voiceChannel.permissionOverwrites
							.edit(
								member,
								{ Connect: false },
								{ reason: 'PLACEHOLDER_PV_REASON_BAN_CONNECT_DISABLE' },
							)
							.catch(console.error)
					: voiceChannel.permissionOverwrites
							.delete(member, 'PLACEHOLDER_PV_REASON_UNBAN_CONNECT_ENABLE')
							.catch(console.error),
				isBanned
					&& voiceChannel.id === member.voice?.channel?.id
					&& member.voice
						?.disconnect('PLACEHOLDER_PV_REASON_BAN_MEMBER_DISCONNECT')
						.catch(console.error),
			]);
		});

		this.orchestrateAction(actionHandler);
	}

	/**
	 * @description
	 * Pone en cola de espera la ejecución de una acción en una sesión de voz.
	 */
	scheduleAction(scheduleId: string, handler: PureVoiceActionHandler, ms: number) {
		this.cancelScheduledAction(scheduleId);

		const timeout = setTimeout(() => {
			this.#actionTimeouts.delete(scheduleId);
			this.orchestrateAction(handler);
		}, ms);

		this.#actionTimeouts.set(scheduleId, timeout);
	}

	/**
	 * @description
	 * Previene la ejecución de una acción de sesión de voz inminente (si existe).
	 */
	cancelScheduledAction(scheduleId: string) {
		const timeout = this.#actionTimeouts.get(scheduleId);
		if (!timeout) return;

		clearTimeout(timeout);
		this.#actionTimeouts.delete(scheduleId);
	}

	/**
	 * @description
	 * Comprueba si existe una acción de sesión de voz en cola de espera (`true`) o no (`false`).
	 */
	hasScheduledAction(scheduleId: string) {
		return this.#actionTimeouts.has(scheduleId);
	}

	/**
	 * @description
	 * Quita de la cola un análisis de cambio de estado de una sesión de voz y lo ejecuta. Si alguna cola no está vacía, se ejecuta consumeAction (prioridad) o consumeUpdate.
	 */
	async #consumeUpdate() {
		const handler = this.#updates.shift();
		await handler?.fetchGuildDocument(this.#guildId).catch(error);

		if (handler?.systemIsInstalled()) {
			try {
				await Promise.all([
					handler.checkFaultySessions(),
					handler.handleDisconnection(),
					handler.handleConnection(),
				]);
				await handler.saveChanges();
			} catch (err) {
				error(err, 'An error occurred while analyzing an orchestrator update.');
			}
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

		if (handler?.systemIsInstalled()) {
			try {
				await handler.performAction().catch(error);
				await handler.saveChanges();
			} catch (err) {
				error(err, 'An error occurred while processing an orchestrator action.');
			}
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

async function destroySession(
	pvDocument: PureVoiceDocument,
	session: PureVoiceSessionDocument,
	guild: Guild,
) {
	const sessionRole = guild.roles.cache.get(session.roleId);
	const oldChannel = guild.channels.cache.get(session.channelId);

	const pvChannelToRemove = guild.channels.cache.get(session.channelId);
	const pvSessionName = pvChannelToRemove?.name
		? `#${pvChannelToRemove.name} (${session.channelId})`
		: session.channelId;
	const deletionMessage = 'Eliminar componentes de sesión PuréVoice';

	debug(`About to remove components for session: ${pvSessionName}...`);

	const results = await Promise.allSettled([
		pvChannelToRemove?.delete(deletionMessage),
		sessionRole?.delete(deletionMessage),
	]);

	if (results.some((result) => result.status === 'rejected')) {
		warn(`Couldn't remove session components. Session entry will remain alive.`);
		return;
	}

	info(`Removed components for session: ${pvSessionName}`);
	debug(`About to remove leftover data for session: ${pvSessionName}...`);

	if (oldChannel) pvDocument.removeFromSessionsList(oldChannel.id);

	const removed = await attemptManyTimes(
		async () => {
			await session.deleteOne().catch((err) => {
				error(new Error(`Failed to remove session entry: #${pvSessionName}`));
				error(err);
			});
			return true;
		},
		3,
		{
			onReattempt: (remaining) =>
				info(`Retrying removal of session entry (${remaining} attempts left)...`),
			getFallback: () => false,
		},
	);

	if (removed) info(`Removed session entry: #${pvSessionName}`);
	else warn(`Couldn't remove session entry: #${pvSessionName}`);

	return;
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

	/**
	 * If applicable, gives the other member the ADMIN role and demotes this member to a MOD role.
	 * @param other The member that will receive the ADMIN role.
	 * @returns Whether the exchange could be made (`true`) or not (`false`).
	 */
	transferAdmin(other: PureVoiceSessionMember) {
		if (this.role === other.role || !this.isAdmin()) return false;

		other.role = PureVoiceSessionMemberRoles.ADMIN;
		this.role = PureVoiceSessionMemberRoles.MOD;

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

	static fromSession(session: PureVoiceSessionDocument): PureVoiceSessionMember[] {
		return [...session.members.values()].map((m) => new PureVoiceSessionMember(m));
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

	const translator = await Translator.fromGuild(guild);

	debug('Attempting to create new control panel channel...');
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

	const controlPanelContainer = new ContainerBuilder()
		.setAccentColor(tenshiColor)
		.addTextDisplayComponents(
			(textDisplay) =>
				textDisplay.setContent(translator.getText('voiceControlPanelSubtitle')),
			(textDisplay) => textDisplay.setContent(translator.getText('voiceControlPanelTitle')),
		)
		.addSeparatorComponents((separator) =>
			separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
		)
		.addActionRowComponents(
			(actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId('voz_setSessionName')
						.setEmoji(getBotEmojiResolvable('pencilWhite'))
						.setLabel(translator.getText('voiceControlPanelButtonRename'))
						.setStyle(ButtonStyle.Primary),
				),
			(actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId('voz_editSessionMembers')
						.setEmoji(getBotEmojiResolvable('userWhite'))
						.setLabel(translator.getText('voiceControlPanelButtonMembersList'))
						.setStyle(ButtonStyle.Primary),
				),
			(actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId('voz_editSessionKillDelay')
						.setEmoji(getBotEmojiResolvable('timerWhite'))
						.setLabel(translator.getText('voiceControlPanelButtonKillDelay'))
						.setStyle(ButtonStyle.Primary),
				),
			(actionRow) =>
				actionRow.addComponents(
					new ButtonBuilder()
						.setCustomId('voz_freezeSession')
						.setEmoji(getBotEmojiResolvable('freezeWhite'))
						.setLabel(translator.getText('voiceControlPanelButtonFreeze'))
						.setStyle(ButtonStyle.Danger),
				),
		);

	debug('Sending menu to control panel.');
	try {
		await controlPanelChannel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [controlPanelContainer],
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
export function getOrchestrator(guildId: string): PureVoiceOrchestrator {
	const orchestrator = orchestrators.get(guildId) || new PureVoiceOrchestrator(guildId);

	if (!orchestrators.has(guildId)) orchestrators.set(guildId, orchestrator);

	return orchestrator;
}

/**
 * @description
 * Performs a cleanup on all existing PuréVoice systems.
 */
export async function cleanupPurevoiceSystems() {
	debug('Inititating PuréVoice System global cleanup.');

	if (!client?.isReady()) throw new ClientNotFoundError();

	const guilds = client.guilds;

	for (const [guildId] of guilds.cache) {
		debug(`Processing orchestrator "${guildId}"...`);
		const orchestrator = getOrchestrator(guildId);
		await orchestrator.check();
	}
}
