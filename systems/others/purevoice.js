const { PureVoiceModel, PureVoiceSessionModel } = require('../../localdata/models/purevoice.js');
const UserConfigs = require('../../localdata/models/userconfigs');
const { tenshiColor }= require('../../localdata/config.json');
const Discord = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes');
const { Translator } = require('../../internationalization');
const chalk = require('chalk');
const { ButtonStyle, ChannelType } = require('discord.js');
const { makeButtonRowBuilder } = require('../../tsCasts');

/**
 * 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfig 
 */
function makeSessionAutoname(userConfig) {
    if(!userConfig?.voice?.autoname) return null;
    return `${userConfig.voice.autoemoji || '💠'}【${userConfig.voice.autoname}】`;
}

/**
 * 
 * @param {import('../../localdata/models/userconfigs').UserConfigDocument} userConfig 
 */
function makeSessionRoleAutoname(userConfig) {
    if(!userConfig?.voice?.autoname) return null;
    return `${userConfig.voice.autoemoji || '💠'} ${userConfig.voice.autoname}`;
}

class PureVoiceUpdateHandler {
    /**@type {import('../../localdata/models/purevoice.js').PureVoiceDocument}*/
    pvDocument;
    /**@type {Discord.VoiceState}*/
    oldState;
    /**@type {Discord.VoiceState}*/
    state;

    /**
     * Crea un nuevo Handler para una actualización de estado de un canal de voz con Sistema PuréVoice
     * @param {Discord.VoiceState} oldState 
     * @param {Discord.VoiceState} state 
     */
    constructor(oldState, state) {
        this.oldState = oldState;
        this.state = state;
    };

    /**
     * Intenta conseguir un documento de sistema PuréVoice del servidor relacionado al cambio detectado, en la base de datos
     * @param {Object} documentQuery 
     * @returns {Promise<void>}
     */
    async getSystemDocument(documentQuery) {
        this.pvDocument = await PureVoiceModel.findOne(documentQuery).catch(err => { console.error(err); return undefined; });
    };

    async relinkDocument() {
        const documentId = this.pvDocument.id;
        this.pvDocument = await PureVoiceModel.findById(documentId).catch(err => { console.error(err); return undefined; });
    };

    /** Comprueba si hay un sistema PuréVoice instalado en el servidor actual o no */
    systemIsInstalled = () => (!!(this.pvDocument && this.state.guild.channels.cache.get(this.pvDocument.categoryId)));
    
    /** Para controlar errores ocasionados por una eliminación prematura de uno de los canales asociados a una sesión */
    prematureError = _ => console.log(chalk.gray('Canal probablemente eliminado prematuramente'));
    
    /** Comprueba si el cambio de estado no es un movimiento entre canales de voz */
    isNotConnectionUpdate = _ => (this.oldState.channelId === this.state.channelId);

    saveChanges = _ => this.pvDocument.save();

    /**
     * Comprueba si el cambio es una desconexión y verifica si el canal quedó vacío para poder eliminar la sesión.
     * Si la sesión no se elimina, en cambio se le revoca el rol de sesión al miembro que se desconectó
     */
    async handleDisconnection() {
        if(this.isNotConnectionUpdate()) return;

        const { pvDocument, oldState, prematureError } = this;
        const { guild, channel: oldChannel, member } = oldState;
        if(!oldChannel) return;

        try {
            const sessionId = pvDocument.sessions.find(sid => sid === oldChannel.id);
            if(!sessionId) return;

            const session = await PureVoiceSessionModel.findOne({ channelId: sessionId });
            if(!session) return;

            const sessionRole = guild.roles.cache.get(session.roleId);

            if(oldChannel.members.filter(member => !member.user.bot).size) {
                let controlPannel = /**@type {Discord.TextChannel}*/(guild.channels.cache.get(pvDocument.controlPanelId));
                if(!controlPannel) {
                    const result = await createPVControlPanelChannel(guild, pvDocument.categoryId);
                    if(result.success) {
                        controlPannel = result.controlPanel;
                        pvDocument.controlPanelId = controlPannel.id;
                    }
                }

                if(controlPannel)
                    controlPannel.permissionOverwrites.delete(member);

                member.roles.remove(sessionRole, 'Desconexión de miembro de sesión PuréVoice').catch(prematureError);
                return;
            }

            const indexToDelete = pvDocument.sessions.indexOf(oldChannel.id);
            if(indexToDelete >= 0) {
                pvDocument.sessions.splice(indexToDelete);
                pvDocument.markModified('sessions');
            }
            
            const controlPannel = /**@type {Discord.TextChannel}*/(guild.channels.cache.get(pvDocument.controlPanelId));
            
            const deletionMessage = 'Eliminar componentes de sesión PuréVoice';
            return Promise.all([
                session.remove(),
                guild.channels.cache.get(session.channelId)?.delete(deletionMessage)?.catch(prematureError),
                controlPannel?.permissionOverwrites?.delete(member, deletionMessage)?.catch(prematureError),
                sessionRole?.delete(deletionMessage)?.catch(prematureError),
            ]);
        } catch(error) {
            console.error(error);
            if(!guild.systemChannelId)
                return guild.fetchOwner().then(owner => owner.send({ content: [
                    `⚠️ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice de tu servidor **${guild.name}**.`,
                    'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
                    'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje.',
                ].join('\n') }).catch(console.error));
            
            return guild.systemChannel.send({ content: [
                '⚠️ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice del servidor.',
                'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
                'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje',
            ].join('\n') }).catch(console.error);
        }
    };

    /**
     * Comprueba si el cambio es una conexión y verifica si el canal al que se conectó es un Canal Automutable PuréVoice o una sesión en curso.
     * Si es una Canal Automutable, se inicia una nueva sesión en base al miembro que se conectó.
     * Si es una sesión en curso, se incorpora al miembro a la sesión
     */
    async handleConnection() {
        if(this.isNotConnectionUpdate()) return;
        
        const { pvDocument, state, prematureError } = this;
        const { guild, channel, member } = state;
        if(!channel || channel?.parentId !== pvDocument.categoryId) return;
        
        //Embed de notificación
        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: 'PuréVoice', iconURL: state.client.user.avatarURL({ size: 128 }) })
            .setFooter({ text: `👥 ${channel.members?.size}` });

        if(channel.id !== pvDocument.voiceMakerId) {
            const currentSessionId = pvDocument.sessions.find(sid => sid === channel.id);
            if(!currentSessionId) return;

            const currentSession = await PureVoiceSessionModel.findOne({ channelId: currentSessionId });
            if(!currentSession) return;

            const sessionRole = guild.roles.cache.get(currentSession.roleId);
            if(!sessionRole) return;
    
            const translator = member.user.bot ? (new Translator('es')) : await Translator.from(member);

            const dbMember = currentSession.members.get(member.id);
            const sessionMember = new PureVoiceSessionMember(dbMember || {
                id: member.id,
                role: PureVoiceSessionMemberRoles.GUEST,
            });

            if(currentSession.frozen && !sessionMember.isAllowedEvenWhenFreezed())
                return member.voice.disconnect('Desconexión forzada de usuario que no forma parte de una sesión PuréVoice congelada').catch(prematureError);

            if(sessionMember.isBanned())
                return member.voice.disconnect('Desconexión forzada de usuario no permitido en una sesión PuréVoice').catch(prematureError);

            await Promise.all([
                member.roles.add(sessionRole, translator.getText('voiceSessionReasonMemberAdd')).catch(prematureError),
                /**@type {Discord.TextChannel}*/(guild.channels.cache.get(pvDocument.controlPanelId))?.permissionOverwrites.edit(member, { ViewChannel: true }).catch(prematureError),
            ]);

            if(dbMember) return;
            
            const userConfigs = await UserConfigs.findOne({ userId: member.id }) || new UserConfigs({ userId: member.id });

            embed.setColor(0x00ff7f)
                .addFields({
                    name: `${member.user.bot ? '🤖' : '👤'} ${translator.getText('voiceSessionNewMemberName')}`,
                    value: translator.getText(member.user.bot ? 'voiceSessionNewMemberValueBotAttached' : 'voiceSessionNewMemberValueMemberIntegrated', `${member}`),
                });

            await channel?.send({
                content: (userConfigs.voice.ping !== 'always' || member.user.bot) ? null : translator.getText('voiceSessionNewMemberContentHint', `${member}`),
                embeds: [embed],
            }).catch(prematureError);
            currentSession.members.set(
                member.id,
                sessionMember.toJSON(),
            );
            currentSession.markModified('members');
            await currentSession.save();
            return;
        }

        try {
            const [ userConfigs, translator ] = await Promise.all([
                UserConfigs.findOne({ userId: member.id }) || new UserConfigs({ userId: member.id }),
                member.user.bot ? (new Translator('es')) : await Translator.from(member),
            ]);

            const prepareSessionRole = async () => {
                const defaultName = member.user.username.slice(0, 24);
                const sessionRole = await guild.roles.create({
                    name: makeSessionRoleAutoname(userConfigs) ?? `🔶 PV ${defaultName}`,
                    color: global.tenshiColor,
                    mentionable: true,
                    reason: translator.getText('voiceSessionReasonRoleCreate'),
                });

                await member.roles.add(sessionRole, translator.getText('voiceSessionReasonFirstMemberAdd')).catch(prematureError);
                await channel?.permissionOverwrites?.edit(sessionRole, { SendMessages: true }, { reason: translator.getText('voiceSessionReasonRoleEdit') }).catch(prematureError);

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
                await sessionMakerChannel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(prematureError);
                await sessionMakerChannel.permissionOverwrites.edit(guild.members.me, { SendMessages: true }).catch(prematureError);

                return sessionMakerChannel;
            };

            const prepareControlPanel = async () => {
                let controlPanel = /**@type {Discord.TextChannel}*/(guild.channels.cache.get(pvDocument.controlPanelId));

                if(controlPanel) {
                    await controlPanel.permissionOverwrites.edit(member, { ViewChannel: true }).catch(prematureError);
                    return controlPanel;
                }

                const result = await createPVControlPanelChannel(guild, pvDocument.categoryId);

                if(result.success) {
                    controlPanel = result.controlPanel;
                    pvDocument.controlPanelId = controlPanel.id;
                    await controlPanel.permissionOverwrites.edit(member, { ViewChannel: true }).catch(prematureError);
                }

                return controlPanel;
            };

            const prepareSessionChannel = async () => {
                if(!channel) return;
                await channel.setName(makeSessionAutoname(userConfigs) ?? '🔶').catch(prematureError);
                await channel.setUserLimit(0).catch(prematureError);
                return channel;
            };

            const [
                sessionRole,
                newSession,
            ] = await Promise.all([
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
                    (new PureVoiceSessionMember({
                        id: member.id,
                        role: PureVoiceSessionMemberRoles.ADMIN,
                    })).toJSON(),
                ),
                killDelaySeconds: 0, //PENDIENTE: UserConfig
            });

            embed.setColor(0x21abcd)
                .setTitle(translator.getText('voiceSessionNewSessionTitle'))
                .addFields(
                    {
                        name: translator.getText('voiceSessionNewSessionCustomizeName'),
                        value: translator.getText('voiceSessionNewSessionCustomizeValue', p_pure(guild.id).raw)
                    },
                    
                    {
                        name: translator.getText('voiceSessionNewSessionNamingName'),
                        value: translator.getText('voiceSessionNewSessionNamingValue', p_pure(guild.id).raw),
                        inline: true,
                    },
                    {
                        name: translator.getText('voiceSessionNewSessionEmoteName'),
                        value: translator.getText('voiceSessionNewSessionEmoteValue'),
                        inline: true,
                    },

                    {
                        name: translator.getText('voiceSessionNewSessionRoleName'),
                        value: translator.getText('voiceSessionNewSessionRoleValue', `${sessionRole}`),
                    },

                    {
                        name: translator.getText('voiceSessionNewSessionRenameName'),
                        value: translator.getText('voiceSessionNewSessionRenameValue'),
                        inline: true,
                    },
                );

            userConfigs.voice.autoname || embed.addFields({
                name: translator.getText('voiceSessionNewSessionAutonameName'),
                value: translator.getText('voiceSessionNewSessionAutonameValue'),
                inline: true,
            });
            
            /**@type {String | Discord.MessagePayload | Discord.MessageCreateOptions}*/
            const startMessage = {
                embeds: [embed],
                components: [
                    makeButtonRowBuilder().addComponents(
                        new Discord.ButtonBuilder({
                            customId: 'voz_showMeHow',
                            label: translator.getText('buttonShowMeHow'),
                            style: ButtonStyle.Primary,
                            emoji: '📖',
                        }),
                )],
            };

            if(userConfigs.voice.ping !== 'never')
                startMessage.content = `👋 ¡Buenas, ${member}!`;

            await channel.send(startMessage).catch(prematureError);
            
            userConfigs.voice.autoname || setTimeout(async () => {
                await this.relinkDocument();
                const { pvDocument } = this;
                if(!pvDocument) return;

                const sessionId = pvDocument.sessions.find(sid => sid === channel.id);
                if(!sessionId) return;

                const session = await PureVoiceSessionModel.findOne({ channelId: sessionId });
                if(!session || session.nameChanged) return;
                
                session.nameChanged = new Date(Date.now());
                
                const name = member.user.username.slice(0, 24);
                const namingReason = translator.getText('voiceSessionReasonChannelForceName');
                return Promise.all([
                    session.save(),
                    channel?.send({ content: '🔹 Se asignó un nombre a la sesión automáticamente' }),
                    channel?.setName(`💠【${name}】`, namingReason),
                    sessionRole?.setName(`💠 ${name}`, namingReason),
                ]).catch(console.error);
            }, 60e3 * 3);
        } catch(error) {
            console.error(error);
            if(!guild.systemChannelId)
                return guild.fetchOwner().then(owner => owner.send({ content: [
                    `⚠️ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice de tu servidor **${guild.name}**. Esto puede deberse a una saturación de acciones o a falta de permisos.`,
                    'Si el problema persiste, desinstala y vuelve a instalar el Sistema',
                ].join('\n') }));
            return guild.systemChannel.send({ content: [
                '⚠️ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice del servidor. Esto puede deberse a una saturación de acciones o a falta de permisos.',
                'Si el problema persiste, prueben desinstalar y volver a instalar el Sistema',
                'Si lo ven necesario, ¡menciónenle el asunto a un moderador!',
            ].join('\n') });
        }
    };

    /**
     * Comprobar si hay sesiones en la base de datos que no corresponden a ningún canal existente, y eliminarlas
     * @returns {Promise<Number>} la cantidad de sesiones defectuosas eliminadas
     */
    async checkFaultySessions() {
        const { pvDocument, state } = this;
        const guildChannels = state.guild.channels.cache;
        const invalidSessionIds = [];

        pvDocument.sessions = pvDocument.sessions.filter(sid => {
            const channelExists = guildChannels.has(sid);
            !channelExists && invalidSessionIds.push(sid);
            return channelExists;
        });

        if(invalidSessionIds.length) {
            await PureVoiceSessionModel.deleteMany({ channelId: { $in: invalidSessionIds } });
            pvDocument.markModified('sessions');
        }

        return invalidSessionIds.length;
    }
}

class PureVoiceOrchestrator {
    /**@type {String}*/
    #guildId;
    /**@type {Array<PureVoiceUpdateHandler>}*/
    #handlers;
    /**@type {Boolean}*/
    #busy;

    /**
     * 
     * @param {String} guildId 
     */
    constructor(guildId) {
        this.#guildId = guildId;
        this.#handlers = [];
        this.#busy = false;
    }

    /**@param {PureVoiceUpdateHandler} updateHandler*/
    async orchestrate(updateHandler) {
        this.#handlers.push(updateHandler);
        if(this.#busy) return true;
        this.#busy = true;
        return this.consumeHandler();
    }

    async consumeHandler() {
        const pv = this.#handlers.shift();
        await pv.getSystemDocument({ guildId: this.#guildId }).catch(console.error);
        if(!pv.systemIsInstalled()) return false;
        
        try {
            await Promise.all([
                pv.checkFaultySessions(),
                pv.handleDisconnection(),
                pv.handleConnection(),
            ]);
            await pv.saveChanges();
        } catch(error) {
            console.log(chalk.redBright('Ocurrió un error mientras se analizaba un cambio de estado en una sesión Purévoice'));
            console.error(error);
        }
        
        if(this.#handlers.length) {
            await this.consumeHandler();
            return false;
        }

        this.#busy = false;
        return false;
    }
}

const PureVoiceSessionMemberRoles = /**@type {const}*/({
	GUEST: 0,
	MOD: 1,
	ADMIN: 2,
});
/**@typedef {import('types').ValuesOf<typeof PureVoiceSessionMemberRoles>} PureVoiceSessionMemberRole*/

/**
 * @typedef {Object} PureVoiceSessionMemberJSONBody
 * @property {String} id
 * @property {Boolean} whitelisted
 * @property {Boolean} banned
 * @property {PureVoiceSessionMemberRole} role
 */

class PureVoiceSessionMember {
	id;
	role;
	#whitelisted;
	#banned;

	/**@param {Partial<PureVoiceSessionMemberJSONBody>} data*/
	constructor(data) {
		this.id = data?.id ?? null;
		this.role = data?.role ?? PureVoiceSessionMemberRoles.GUEST;
		this.#whitelisted = !!(data?.whitelisted ?? false);
		this.#banned = !!(data?.banned ?? false);
	}

    /**@param {PureVoiceSessionMember} other*/
    exchangeAdmin(other) {
        if(this.role === other.role || !this.isAdmin())
            return false;

        const tempRole = other.role;
        other.role = this.role;
        this.role = tempRole;

        return true;
    }

    /**@param {PureVoiceSessionMember} other*/
    giveMod(other) {
        if(!this.isAdmin() || !other.isGuest())
            return false;

        other.role = PureVoiceSessionMemberRoles.MOD;
        return true;
    }

    /**@param {PureVoiceSessionMember} other*/
    revokeMod(other) {
        if(!this.isAdmin() || !other.isMod())
            return false;

        other.role = PureVoiceSessionMemberRoles.GUEST;
        return true;
    }

	/**@param {Boolean} whitelist*/
	setWhitelisted(whitelist) {
		this.#whitelisted = !!whitelist;
        return this;
	}
	
	/**@param {Boolean} ban*/
	setBanned(ban) {
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
        if(this.isBanned()) return false;

		return this.isAdmin()
			|| this.isMod()
			|| this.#whitelisted;
    }

	isBanned() {
		return this.isGuest()
			&& this.#banned;
	}

	/**@returns {PureVoiceSessionMemberJSONBody} */
	toJSON() {
		return {
			id: this.id,
			role: this.role,
			banned: this.#banned,
			whitelisted: this.#whitelisted,
		};
	}
}

/**
 * 
 * @param {Discord.Guild} guild
 * @param {String} categoryId 
 * @returns {Promise<{ success: false, status: 'InvalidParams' | 'NoChannel' | 'NoCategory' | 'NameAlreadyTaken' | 'NoPermissions' } | { success: true, status: 'Success', controlPanel: Discord.TextChannel }>}
 */
async function createPVControlPanelChannel(guild, categoryId) {
    if(!(guild instanceof Discord.Guild) || typeof categoryId !== 'string')
        return { success: false, status: 'InvalidParams' };

    let categoryChannel = guild.channels.cache.get(categoryId);

    if(!categoryChannel)
        return { success: false, status: 'NoChannel' };

    if(categoryChannel.type !== ChannelType.GuildCategory)
        return { success: false, status: 'NoCategory' };

    if(!guild.members.me.permissions.has('ManageChannels', true))
        return { success: false, status: 'NoPermissions' };

    const controlPanelName = '💻〖𝓟𝓥〗';
    
    categoryChannel = await categoryChannel.fetch(true);
    if(guild.channels.cache.some(channel => channel.name === controlPanelName))
        return { success: false, status: 'NameAlreadyTaken' };

    const controlPanelChannel = await guild.channels.create({
        type: ChannelType.GuildText,
        parent: categoryChannel,
        name: controlPanelName,
        position: 999,
        permissionOverwrites: [
            { id: guild.roles.everyone, deny: [ 'ViewChannel', 'SendMessages' ] },
            { id: guild.members.me, allow: [ 'ViewChannel', 'SendMessages' ] },
        ],
        reason: 'Crear Panel de Control PuréVoice',
    });

    const controlPanelEmbed = new Discord.EmbedBuilder()
        .setColor(tenshiColor)
        .setAuthor({ name: 'Bot de Puré', url: 'https://i.imgur.com/P9eeVWC.png' })
        .addFields(
            {
                name: '<:es:1084646419853488209> Panel de Control',
                value: 'Configura una sesión aquí',
                inline: true,
            },
            {
                name: '<:en:1084646415319453756> Control Panel',
                value: 'Configure a session here',
                inline: true,
            },
            {
                name: '🇯🇵 コントロールパネル',
                value: 'ここでセッションを設定',
                inline: true,
            },
        );

    const controlPanelButtons = makeButtonRowBuilder().addComponents(
        new Discord.ButtonBuilder()
            .setCustomId('voz_setSessionName')
            .setEmoji('1288444896331698241')
            .setStyle(ButtonStyle.Primary),
        new Discord.ButtonBuilder()
            .setCustomId('voz_editSessionMembers')
            .setEmoji('1288445753425002527')
            .setStyle(ButtonStyle.Primary),
        new Discord.ButtonBuilder()
            .setCustomId('voz_editSessionKillDelay')
            .setEmoji('1296729492550582363')
            .setStyle(ButtonStyle.Primary),
        new Discord.ButtonBuilder()
            .setCustomId('voz_freezeSession')
            .setEmoji('1296661603814473758')
            .setStyle(ButtonStyle.Danger),
    );

    await controlPanelChannel.send({
        embeds: [controlPanelEmbed],
        components: [controlPanelButtons],
    });

    return { success: true, status: 'Success', controlPanel: controlPanelChannel };
}

/**
 * @param {Discord.VoiceBasedChannel} voiceChannel
 * @param {Map<String, Partial<PureVoiceSessionMemberJSONBody>>} dbMembers
 */
function getFrozenSessionAllowedMembers(voiceChannel, dbMembers) {
    const voiceMembers = voiceChannel.members;
    
    const allowedSessionMembers = /**@type {Map<String, PureVoiceSessionMember>}*/(new Map());

    for(const [ id, dbMember ] of dbMembers) {
        const sessionMember = new PureVoiceSessionMember(dbMember);
        if(sessionMember.isAllowedEvenWhenFreezed() || voiceMembers.has(dbMember.id))
            allowedSessionMembers.set(id, sessionMember);
    }

    return allowedSessionMembers;
}

module.exports = {
    PureVoiceUpdateHandler,
    PureVoiceOrchestrator,
    PureVoiceSessionMember,
    makeSessionAutoname,
    makeSessionRoleAutoname,
    createPVControlPanelChannel,
    getFrozenSessionAllowedMembers,
    PureVoiceSessionMemberRoles,
};
