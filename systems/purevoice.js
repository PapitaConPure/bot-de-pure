const PureVoice = require('../localdata/models/purevoice');
const Discord = require('discord.js');
const { default: mongoose } = require('mongoose');
const { p_pure } = require('../localdata/customization/prefixes');
const chalk = require('chalk');

class PureVoiceUpdateHandler {
    /**@type {mongoose.Document}*/
    pvDocument;
    /**@type {Discord.VoiceState}*/
    oldState;
    /**@type {Discord.VoiceState}*/
    state;

    /**
     * Crea un nuevo Handler para una actualización de estado de un canal de voz con Sistema PuréVoice
     * @param {Object} documentQuery 
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
        this.pvDocument = await PureVoice.findOne(documentQuery).catch(console.error);
    };

    async relinkDocument() {
        const documentId = this.pvDocument.id;
        this.pvDocument = await PureVoice.findById(documentId).catch(console.error)
    };

    /** Comprueba si hay un sistema PuréVoice instalado en el servidor actual o no */
    systemIsInstalled = _ => this.pvDocument && this.state.guild.channels.cache.get(this.pvDocument.categoryId);
    
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
    handleDisconnection() {
        if(this.isNotConnectionUpdate()) return;

        const { pvDocument, oldState, prematureError } = this;
        const { guild, channel: oldChannel, member } = oldState;
        if(!oldChannel) return;

        try {
            // console.log('Desconexión del canal', oldChannel.name, 'con', oldChannel.members.filter(member => !member.user.bot).size, 'miembros');
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
            if(guild.systemChannelId)
                guild.systemChannel.send({ content: [
                    '⚠ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice del servidor.',
                    'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
                    'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje',
                ].join('\n') }).catch(console.error);
            else
                guild.fetchOwner().then(owner => owner.send({ content: [
                    `⚠ Ocurrió un problema en un intento de remover una sesión del Sistema PuréVoice de tu servidor **${guild.name}**.`,
                    'Esto puede deberse a una conexión en una sesión PuréVoice que estaba siendo eliminada.',
                    'Si el par de canales relacionales de la sesión fueron eliminados, puedes ignorar este mensaje.',
                ].join('\n') }).catch(console.error));
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
        const embed = new Discord.MessageEmbed()
            .setAuthor({ name: 'PuréVoice', iconURL: state.client.user.avatarURL({ size: 64, format: 'jpg' }) })
            .setFooter({ text: `👥 ${channel.members?.size}` });

        if(channel.id !== pvDocument.voiceMakerId) {
            const currentSession = pvDocument.sessions.find(session => session.voiceId === channel.id);
            if(!currentSession) return;

            const sessionRole = guild.roles.cache.get(currentSession.roleId);
            if(!sessionRole || !channel) return;
    
            await member.roles.add(sessionRole, 'Inclusión de miembro en sesión PuréVoice');
    
            if(currentSession.joinedOnce?.includes(member.id)) return;
            embed.setColor('#00ff7f')
                .addField(`${member.user.bot ? '🤖' : '👤'} Nueva conexión`,
                    member.user.bot
                        ? `El bot **${member.user.tag}** fue anexado a la sesión`
                        : `El miembro **${member.user.tag}** fue incorporado a la sesión`);

            await channel?.send({
                content: member.user.bot ? null : `👋 ${member}, ¡puedes conversar por aquí!`,
                embeds: [embed],
            }).catch(prematureError);
            currentSession.joinedOnce.push(member.id);
            pvDocument.markModified('sessions');
            return;
        }

        try {
            const defaultName = member.user.username.slice(0, 24);
            const sessionRole = await guild.roles.create({
                name: `🔶 PV ${defaultName}`,
                color: global.tenshiColor,
                mentionable: true,
                reason: 'Inyectar Rol Efímero PuréVoice',
            });
            const newSession = await guild.channels.create('➕ Nueva Sesión', {
                type: 'GUILD_VOICE',
                parent: pvDocument.categoryId,
                bitrate: 64e3,
                userLimit: 1,
                reason: 'Desplegar Canal Automutable PuréVoice',
                permissionOverwrites: [
                    { id: guild.roles.everyone.id,  deny:   [ 'SEND_MESSAGES' ] },
                    { id: guild.me.id,              allow:  [ 'SEND_MESSAGES' ] },
                ],
            });
            
            pvDocument.voiceMakerId = newSession.id;
            pvDocument.sessions.push({
                voiceId: channel.id,
                roleId: sessionRole.id,
                joinedOnce: [ member.id ],
                nameChanged: 0,
            });
            pvDocument.markModified('sessions');
            console.log(chalk.gray('Se marcó para guardar'));

            await Promise.all([
                channel?.permissionOverwrites?.edit(sessionRole, { SEND_MESSAGES: true, reason: 'Conceder envío de mensajes a rol de sesión PuréVoice' }),
                member.roles.add(sessionRole, 'Inclusión de primer miembro en sesión PuréVoice'),
            ]).catch(prematureError);
            await channel.setName('🔶').catch(prematureError);
            await channel.setUserLimit(0).catch(prematureError);

            embed.setColor('#21abcd')
                .setTitle('✅ Sesión inicializada')

                .addField('🎨 Personalizar sesión', `Puedes personalizar el nombre y emote del par de canales y rol de la sesión\n\`\`\`${p_pure(guild.id).raw}voz <Nombre>[ -e <Emote>]\`\`\``)

                .addField('🏷️ Nombre', `Puedes usar \`${p_pure(guild.id).raw}voz <Nombre>\` para cambiar el nombre`, true)
                .addField('🐴 Emote', 'Añade `--emote <Emote>` o `-e <Emote>` para cambiar el emote', true)
                .addField('📣 Rol Efímero', `Este rol menciona a todos en la sesión\n${sessionRole}`, true)

                .addField('🧹 Renombrar sesión', 'Debes esperar 20 minutos entre cada renombrado de la sesión', true)
                .addField('⏱️ Nombre automático', 'Si no escribes un nombre de sesión en 2 minutos, se nombrará automáticamente', true);

            await channel.send({
                content: `👋 ¡Buenas, ${member}!`,
                embeds: [embed],
                components: [new Discord.MessageActionRow().addComponents(
                    new Discord.MessageButton({
                        customId: 'voz_showMeHow',
                        label: 'Muéstrame cómo',
                        style: 'PRIMARY',
                        emoji: '📖',
                    }),
                )],
            }).catch(prematureError);
            
            setTimeout(async () => {
                await this.relinkDocument();
                const { pvDocument } = this;
                if(!pvDocument) return;

                const sessionIndex = pvDocument.sessions.findIndex(session => session.voiceId === channel.id);
                const session = pvDocument.sessions[sessionIndex];
                if(!session || session.nameChanged) return;
                pvDocument.sessions[sessionIndex].nameChanged = Date.now();
                pvDocument.markModified('sessions');
                
                const name = member.user.username.slice(0, 24);
                const namingReason = 'Renombrar sesión PuréVoice (forzado automáticamente)';
                return await Promise.all([
                    pvDocument.save(),
                    channel?.send({ content: '🔹 Se asignó un nombre a la sesión automáticamente' }),
                    channel?.setName(`💠【${name}】`, namingReason),
                    sessionRole?.setName(`💠 ${name}`, namingReason),
                ]).catch(console.error);
            }, 60e3 * 2);
        } catch(error) {
            console.error(error);
            if(guild.systemChannelId)
                guild.systemChannel.send({ content: [
                    '⚠ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice del servidor. Esto puede deberse a una saturación de acciones o a falta de permisos.',
                    'Si el problema persiste, prueben desinstalar y volver a instalar el Sistema',
                    'Si lo ven necesario, ¡menciónenle el asunto a un moderador!',
                ].join('\n') });
            else
                await guild.fetchOwner().then(owner => owner.send({ content: [
                    `⚠ Ocurrió un problema al crear una nueva sesión para el Sistema PuréVoice de tu servidor **${guild.name}**. Esto puede deberse a una saturación de acciones o a falta de permisos.`,
                    'Si el problema persiste, desinstala y vuelve a instalar el Sistema',
                ].join('\n') }));
        }
    };

    /**
     * Comprobar si hay sesiones en la base de datos que no corresponden a ningún canal existente, y eliminarlas
     * @returns {Promise<Number>} la cantidad de sesiones defectuosas eliminadas
     */
    async checkFaultySessions() {
        const { pvDocument, state, prematureError } = this;
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

module.exports = {
    PureVoiceUpdateHandler,
};