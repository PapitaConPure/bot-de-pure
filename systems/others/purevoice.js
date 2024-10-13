const PureVoice = require('../../localdata/models/purevoice.js');
const UserConfigs = require('../../localdata/models/userconfigs')
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
        this.pvDocument = await PureVoice.findOne(documentQuery).catch(err => { console.error(err); return undefined; });
    };

    async relinkDocument() {
        const documentId = this.pvDocument.id;
        this.pvDocument = await PureVoice.findById(documentId).catch(err => { console.error(err); return undefined; });
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
     * @returns {Promise<*>}
     */
    async handleDisconnection() {
        if(this.isNotConnectionUpdate()) return;

        const { pvDocument, oldState, prematureError } = this;
        const { guild, channel: oldChannel, member } = oldState;
        if(!oldChannel) return;

        try {
            const sessionIndex = pvDocument.sessions.findIndex(s => s.voiceId === oldChannel.id);
            if(sessionIndex === -1) return;

            const session = pvDocument.sessions[sessionIndex];
            const sessionRole = guild.roles.cache.get(session.roleId);

            if(oldChannel.members.filter(member => !member.user.bot).size) {
                member.roles.remove(sessionRole, 'Desconexión de miembro de sesión PuréVoice');
                return;
            }
            
            pvDocument.sessions.splice(sessionIndex, 1);
            pvDocument.markModified('sessions');
            const deletionMessage = 'Eliminar componentes de sesión PuréVoice';
            return Promise.all([
                guild.channels.cache.get(session.voiceId)?.delete(deletionMessage)?.catch(prematureError),
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
     * @returns {Promise<*>}
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

        const translator = member.user.bot ? (new Translator('es')) : (await Translator.from(member));

        if(channel.id !== pvDocument.voiceMakerId) {
            const currentSession = pvDocument.sessions.find(session => session.voiceId === channel.id);
            if(!currentSession) return;

            const sessionRole = guild.roles.cache.get(currentSession.roleId);
            if(!sessionRole || !channel) return;
    
            await member.roles.add(sessionRole, translator.getText('voiceSessionReasonMemberAdd'));

            if(currentSession.joinedOnce?.includes(member.id)) return;
            
            const userConfigs = await UserConfigs.findOne({ userId: member.id }) || new UserConfigs({ userId: member.id });
            if(userConfigs.voice.ping !== 'always') return;

            embed.setColor(0x00ff7f)
                .addFields({
                    name: `${member.user.bot ? '🤖' : '👤'} ${translator.getText('voiceSessionNewMemberName')}`,
                    value: translator.getText(member.user.bot ? 'voiceSessionNewMemberValueBotAttached' : 'voiceSessionNewMemberValueMemberIntegrated', member.user.tag),
                });

            await channel?.send({
                content: member.user.bot ? null : translator.getText('voiceSessionNewMemberContentHint', `${member}`),
                embeds: [embed],
            }).catch(prematureError);
            currentSession.joinedOnce.push(member.id);
            pvDocument.markModified('sessions');
            return;
        }

        try {
            const userConfigs = await UserConfigs.findOne({ userId: member.id }) || new UserConfigs({ userId: member.id });

            const defaultName = member.user.username.slice(0, 24);
            const sessionRole = await guild.roles.create({
                name: makeSessionRoleAutoname(userConfigs) ?? `🔶 PV ${defaultName}`,
                color: global.tenshiColor,
                mentionable: true,
                reason: translator.getText('voiceSessionReasonRoleCreate'),
            });
            const newSession = await guild.channels.create({
                name: '➕',
                type: ChannelType.GuildVoice,
                parent: pvDocument.categoryId,
                bitrate: 64e3,
                userLimit: 1,
                reason: translator.getText('voiceSessionReasonChannelCreate'),
            });
            
            pvDocument.voiceMakerId = newSession.id;
            pvDocument.sessions.push({
                voiceId: channel.id,
                roleId: sessionRole.id,
                joinedOnce: [ member.id ],
                nameChanged: 0,
            });
            pvDocument.markModified('sessions');

            await newSession.lockPermissions().catch(prematureError);
            await newSession.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(prematureError);
            await Promise.all([
                newSession.permissionOverwrites.edit(guild.members.me, { SendMessages: false }),
                member.roles.add(sessionRole, translator.getText('voiceSessionReasonFirstMemberAdd')),
            ]).catch(prematureError);
            await channel?.permissionOverwrites?.edit(sessionRole, { SendMessages: true }, { reason: translator.getText('voiceSessionReasonRoleEdit') }).catch(prematureError);
            await channel?.setName(makeSessionAutoname(userConfigs) ?? '🔶').catch(prematureError);
            await channel?.setUserLimit(0).catch(prematureError);

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

                const sessionIndex = pvDocument.sessions.findIndex(session => session.voiceId === channel.id);
                const session = pvDocument.sessions[sessionIndex];
                if(!session || session.nameChanged) return;
                pvDocument.sessions[sessionIndex].nameChanged = Date.now();
                pvDocument.markModified('sessions');
                
                const name = member.user.username.slice(0, 24);
                const namingReason = translator.getText('voiceSessionReasonChannelForceName');
                return Promise.all([
                    pvDocument.save(),
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
        let deleted = 0;

        pvDocument.sessions = pvDocument.sessions.filter(session => {
            const voiceChannel = guildChannels.get(session.voiceId);
            if(voiceChannel) {
                deleted += 1;
                return true;
            }
        });
        if(deleted)
            pvDocument.markModified('sessions');

        return deleted;
    };
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

module.exports = {
    PureVoiceUpdateHandler,
    PureVoiceOrchestrator,
    makeSessionAutoname,
    makeSessionRoleAutoname,
};