const { PureVoiceModel: PureVoice, PureVoiceSessionModel } = require('../../localdata/models/purevoice.js');
const { PureVoiceSessionMember, getFrozenSessionAllowedMembers, makePVSessionName } = require('../../systems/others/purevoice.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageCollector, ButtonStyle, Colors, ChannelType, Collection, ModalBuilder, TextInputStyle, TextInputBuilder } = require('discord.js');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { isNotModerator, defaultEmoji } = require('../../func.js');
const { CommandOptions, CommandTags, CommandManager } = require('../Commons/commands');
const { makeButtonRowBuilder, makeTextInputRowBuilder } = require('../../tsCasts.js');
const { Translator } = require('../../internationalization');

const cancelbutton = (id) => new ButtonBuilder()
	.setCustomId(`voz_cancelWizard_${id}`)
	.setEmoji('936531643496288288')
	.setStyle(ButtonStyle.Secondary);
const collectors = {};

const options = new CommandOptions()
	.addParam('nombre', 'TEXT', 'para decidir el nombre de la sesión actual', { optional: true })
	.addFlag('e', ['emote', 'emoji'], 'para determinar el emote de la sesión actual', { name: 'emt', type: 'EMOTE' })
	.addFlag('i', ['invitar', 'invite'], 'para invitar del canal a la sesión actual')
	.addFlag('aw', ['asistente','instalador','wizard'], 'para inicializar el Asistente de Configuración');
const flags = new CommandTags().add('COMMON');
const command = new CommandManager('voz', flags)
	.setAliases(
		'purévoz', 'purevoz',
		'voice', 'purévoice', 'purevoice',
		'vc',
	)
	.setBriefDescription('Para inyectar un Sistema PuréVoice en una categoria por medio de un Asistente')
	.setLongDescription('Para inyectar un Sistema PuréVoice en una categoria. Simplemente usa el comando y sigue los pasos del Asistente para configurar todo')
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.user);

		if(args.parseFlag('asistente'))
			return generateFirstWizard(request, translator);
		
		//Cambiar nombre de canal de voz de sesión
		const helpstr = `Usa \`${p_pure(request.guildId).raw}ayuda voz\` para más información`;
		const emoteString = args.parseFlagExpr('emote', x => `${x}`, '💠');
		const sessionEmote = defaultEmoji(emoteString);
		const sessionName = args.getString('nombre', true);
		
		if(!sessionName)
			return request.reply({
				content: [
					'⚠️ Debes ingresar un nombre para ejecutar este comando de esta forma',
					'Si estás buscando iniciar un Asistente de Configuración, usa la bandera `--asistente` o `-a`',
					helpstr,
				].join('\n'),
				ephemeral: true,
			});
		
		if(sessionName.length > 24)
			return request.reply({
				content: '⚠️ Intenta acortar un poco el nombre. El límite para nombres de sesión es de 24(+3) caracteres',
				ephemeral: true,
			});

		if(!sessionEmote)
			return request.reply({
				content: [
					'⚠️ Emote inválido',
					'Recuerda que no se pueden usar emotes personalizados para nombres de canales',
					'También, ten en cuenta que algunos emotes estándar de Discord no son *tan estándar* y __no se espera__ que se detecten/funcionen correctamente',
				].join('\n'),
				ephemeral: true,
			});

		//Comprobar si se está en una sesión
		const voiceState = request.member.voice;
		const warnNotInSession = () => request.reply({
			content: translator.getText('voiceCommandRenameMemberExpected', p_pure(request.guildId).raw),
			ephemeral: true,
		}).catch(console.error);

		if(!voiceState?.channelId)
			return warnNotInSession();

		const createInvite = args.parseFlag('invitar');

		if(createInvite) {
			const invite = await request.guild.invites.create(voiceState.channel, { maxAge: 5 * 60 }).catch(_ => null);

			if(invite)
				return request.reply({ content: `${invite}` });

			const channelRef = `${voiceState.channel ?? '⚠️️ Canal inválido'}`;
			const embed = new EmbedBuilder()
				.setColor('Blurple')
				.setAuthor({
					name: request.member.displayName,
					iconURL: request.member.displayAvatarURL(),
				})
				.addFields({ name: 'Invitación a canal', value: channelRef });

			return request.reply({ embeds: [embed] });
		}

		//Modificar sesión y confirmar
		const session = await PureVoiceSessionModel.findOne({ channelId: voiceState.channelId });
		if(!session) return warnNotInSession();

		const sessionMember = new PureVoiceSessionMember(session.members.get(request.member.id));
		if(!sessionMember) return warnNotInSession();

		if(sessionMember.isGuest())
			return request.reply({ content: translator.getText('voiceSessionAdminOrModExpected'), ephemeral: true });

		const { channelId: voiceId, roleId, nameChanged } = session;
		if((Date.now() - (+nameChanged)) < 60e3 * 20)
			return request.reply({
				content: [
					'❌ Por cuestiones técnicas, solo puedes cambiar el nombre de la sesión una vez cada 20 minutos.',
					`Inténtalo de nuevo <t:${Math.round(+nameChanged / 1000 + 60 * 20)}:R>, o conéctate a una nueva sesión`,
				].join('\n'),
			});
		session.nameChanged = new Date(Date.now());

		const guildChannels = request.guild.channels.cache;
		const guildRoles = request.guild.roles.cache;
		return Promise.all([
			session.save(),
			guildChannels.get(voiceId)?.setName(`${sessionEmote}【${sessionName}】`, 'Renombrar sesión PuréVoice'),
			guildRoles.get(roleId)?.setName(`${sessionEmote} ${sessionName}`, 'Renombrar sesión PuréVoice'),
			request.reply({ content: '✅ Nombre aplicado', ephemeral: true }),
		]).catch(() => request.reply({ content: '⚠️ Ocurrió un error al aplicar el nombre', ephemeral: true }));
	})
	.setButtonResponse(async function startWizard(interaction, authorId) {
		const { user, guild } = interaction;
		
		if(user.id !== authorId)
			return interaction.reply({ content: '❌ No puedes hacer esto', ephemeral: true });
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), '2/? • Seleccionar Operación', Colors.Navy)
			.addFields({
				name: 'Inyección de Sistema PuréVoice',
				value: '¿Qué deseas hacer ahora mismo?',
			});
			
		const pv = await PureVoice.findOne({ guildId: guild.id });
		const uid = user.id;
		const row = makeButtonRowBuilder();
		const isInstalled = pv && guild.channels.cache.get(pv.categoryId) && guild.channels.cache.get(pv.voiceMakerId);
		if(!isInstalled)
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_selectInstallation_${uid}`)
					.setLabel('Instalar')
					.setStyle(ButtonStyle.Primary),
			);
		else 
			row.addComponents(
				new ButtonBuilder()
					.setCustomId(`voz_relocateSystem_${uid}`)
					.setLabel('Reubicar')
					.setStyle(ButtonStyle.Primary),
			);

		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`voz_deleteSystem_${uid}`)
				.setLabel('Desinstalar')
				.setStyle(ButtonStyle.Danger)
				.setDisabled(!isInstalled),
			cancelbutton(uid),
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	})
	.setButtonResponse(async function selectInstallation(interaction, authorId) {
		if(interaction.user.id !== authorId)
			return interaction.reply({ content: '❌ No puedes hacer esto', ephemeral: true });

		const wizard = wizEmbed(interaction.client.user.avatarURL(), '3/4 • Seleccionar instalación', Colors.Gold)
			.addFields({
				name: 'Instalación',
				value: 'Selecciona el tipo de instalación que deseas realizar',
			});
		const row = makeButtonRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`voz_installSystem_${authorId}_new`)
				.setLabel('Crear categoría con PuréVoice')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`voz_installSystem_${authorId}`)
				.setLabel('Inyectar PuréVoice en categoría')
				.setStyle(ButtonStyle.Primary),
			cancelbutton(authorId),
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	})
	.setButtonResponse(async function installSystem(interaction, authorId, createNew) {
		if(interaction.user.id !== authorId)
			return interaction.reply({ content: '❌ No puedes hacer esto', ephemeral: true });
		
		const filter = (m) => m.author.id === authorId;
		collectors[interaction.id] = new MessageCollector(interaction.channel, { filter, time: 1000 * 60 * 2 });
		collectors[interaction.id].on('collect', async collected => {
			let ccontent = collected.content;
			let category;
			if(!createNew) {
				if(ccontent.startsWith('<#') && ccontent.endsWith('>')) {
					ccontent = ccontent.slice(2, -1);
					if(ccontent.startsWith('!')) ccontent = ccontent.slice(1);
				}
				const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
				category = isNaN(ccontent)
					? categories.find(c => c.name.toLowerCase().indexOf(ccontent) !== -1)
					: categories.find(c => c.id === ccontent);
				if(category) {
					collected.delete().catch(() => console.log('Error menor al borrar mensaje recolectado'));
					collectors[interaction.id].stop();
				} else return;
			} else {
				await collected.delete().catch(() => console.log('Error menor al borrar mensaje recolectado'));
				category = await interaction.guild.channels.create({ name: ccontent, type: ChannelType.GuildCategory, reason: 'Categoría recipiente de PuréVoice' });
			}
			
			try {
				const voiceMaker = await interaction.guild.channels.create({
					name: '➕',
					type: ChannelType.GuildVoice,
					parent: category.id,
					bitrate: 64 * 1000,
					userLimit: 1,
					reason: 'Desplegar Canal Autoextensible PuréVoice',
				});

				await voiceMaker.lockPermissions().catch(console.error);
				await voiceMaker.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(console.error);
				await voiceMaker.permissionOverwrites.edit(interaction.guild.members.me,     { SendMessages: true  }).catch(console.error);

				//Guardar nueva categoría PuréVoice
				const guildQuery = { guildId: interaction.guild.id };
				await PureVoice.deleteOne(guildQuery);
				const pv = new PureVoice({
					...guildQuery,
					categoryId: category.id,
					voiceMakerId: voiceMaker.id,
				});

				const wizard = wizEmbed(interaction.client.user.avatarURL(), 'Operación finalizada', Colors.Green)
					.addFields({
						name: 'Categoría creada e inyectada',
						value: [
							'Se ha creado una categoría que ahora escala de forma dinámica sus canales de voz.',
							`Puedes reubicar el Sistema PuréVoice creado en el futuro, solo usa \`${p_pure(interaction.guildId).raw}voz\` otra vez`,
						].join('\n'),
					});

				const finished = await Promise.all([
					pv.save(),
					interaction.message.edit({
						embeds: [wizard],
						components: [],
					}),
				]);
				collectors[interaction.id].stop();
				delete collectors[interaction.id];
				return finished;
			} catch(error) {
				console.error(error);
				return interaction.channel.send({ content: [
					'⚠️ Ocurrió un error al crear esta categoría',
					'Asegúrate de que tenga los permisos necesarios para realizar esta acción (administrar canales)',
					'También, verifica que el nombre ingresado no esté ya ocupado por alguna otra categoría o canal',
				].join('\n') });
			}
		});
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), `4/4 • ${createNew ? 'Nombrar' : 'Seleccionar'} categoría`, Colors.Navy)
			.addFields({
				name: `${createNew ? 'Creación' : 'Selección'} de categoría`,
				value: 'Menciona el nombre de la categoría antes de inyectarle PuréVoice',
			});
		const uid = interaction.user.id;
		const row = makeButtonRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`voz_startWizard_${uid}`)
				.setEmoji('934432754173624373')
				.setStyle(ButtonStyle.Secondary),
			cancelbutton(uid),
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	})
	.setButtonResponse(async function deleteSystem(interaction, authorId) {
		if(interaction.user.id !== authorId)
			return interaction.reply({ content: '❌ No puedes hacer esto', ephemeral: true });
		
		const wizard = wizEmbed(interaction.client.user.avatarURL(), 'Confirmar desinstalación', Colors.Yellow)
			.addFields({
				name: 'Desinstalación del Sistema PuréVoice del servidor',
				value: [
					'Esto borrará todas los canales creados por el Sistema. La categoría del Sistema y los canales creados manualmente se ignorarán.',
					'Confirma la desasociación del servidor con PuréVoice',
				].join('\n'),
			});
		const uid = interaction.user.id;
		const row = makeButtonRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`voz_deleteSystemConfirmed_${uid}`)
				.setLabel('DESINSTALAR')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId(`voz_startWizard_${uid}`)
				.setEmoji('934432754173624373')
				.setStyle(ButtonStyle.Secondary),
			cancelbutton(uid),
		);
		return interaction.update({
			embeds: [wizard],
			components: [row],
		});
	})
	.setButtonResponse(async function deleteSystemConfirmed(interaction, authorId) {
		if(interaction.user.id !== authorId)
			return interaction.reply({ content: '❌ No puedes hacer esto', ephemeral: true });

		//Eliminar Sistema PuréVoice
		const guildQuery = { guildId: interaction.guildId };
		const pv = await PureVoice.findOne(guildQuery);
		if(pv) {
			const guildChannels = interaction.guild.channels.cache;
			await Promise.all([
				guildChannels.get(pv.voiceMakerId)?.delete(`PuréVoice desinstalado por ${interaction.user.username}`).catch(console.error),
				guildChannels.get(pv.controlPanelId)?.delete(`PuréVoice desinstalado por ${interaction.user.username}`).catch(console.error),
			]);

			await Promise.all([
				PureVoiceSessionModel.deleteMany({ channelId: { $in: pv.sessions } }),
				PureVoice.deleteOne(guildQuery),
			]);
		}
		
		const deleteEmbed = wizEmbed(interaction.client.user.avatarURL(), 'Operación finalizada', Colors.Red)
			.addFields({
				name: 'Sistema PuréVoice eliminado',
				value: 'Se eliminó el Sistema PuréVoice asociado al servidor',
			});
		return interaction.update({
			embeds: [deleteEmbed],
			components: [],
		});	
	})
	.setButtonResponse(async function cancelWizard(interaction, authorId) {
		if(interaction.user.id !== authorId)
			return interaction.reply({ content: '❌ No puedes hacer esto', ephemeral: true });
		
		const cancelEmbed = wizEmbed(interaction.client.user.avatarURL(), 'Operación abortada', Colors.NotQuiteBlack)
			.addFields({
				name: 'Asistente cancelado',
				value: 'Se canceló la configuración del Sistema PuréVoice'
			});
		return interaction.update({
			embeds: [cancelEmbed],
			components: [],
		});
	})
	.setButtonResponse(async function setSessionName(interaction) {
		const { guildId, member } = interaction;
        const translator = await Translator.from(member);

		const warnNotInSession = () => interaction.reply({
			content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
			ephemeral: true,
		}).catch(console.error);

		const voiceChannel = member.voice?.channel;
		if(!voiceChannel) return warnNotInSession();

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if(!session) return warnNotInSession();
		
        const modal = new ModalBuilder()
            .setCustomId(`voz_applySessionRename`)
            .setTitle(translator.getText('yoVoiceAutonameModalTitle'))
            .addComponents(
                makeTextInputRowBuilder().addComponents(new TextInputBuilder()
                    .setCustomId('inputName')
                    .setLabel(translator.getText('name'))
                    .setPlaceholder(translator.getText('yoVoiceAutonameModalNamingPlaceholder'))
                    .setMinLength(1)
                    .setMaxLength(24)
                    .setRequired(true)
					//.setValue(session.name ?? '')
                    .setStyle(TextInputStyle.Short)),
                makeTextInputRowBuilder().addComponents(new TextInputBuilder()
                    .setCustomId('inputEmoji')
                    .setLabel(translator.getText('emoji'))
                    .setPlaceholder(translator.getText('yoVoiceAutonameModalEmojiPlaceholder'))
                    .setMinLength(0)
                    .setMaxLength(2)
                    .setRequired(false)
					//.setValue(session.emoji ?? '')
                    .setStyle(TextInputStyle.Short)),
            );

        return interaction.showModal(modal);
	})
	.setModalResponse(async function applySessionName(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const { guildId, member } = interaction;
        const translator = await Translator.from(member);

		const warnNotInSession = () => interaction.editReply({
			content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
		}).catch(console.error);

		const voiceChannel = member.voice?.channel;

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if(!session) return warnNotInSession();

		const name = interaction.fields.getTextInputValue('inputName');
		const emoji = interaction.fields.getTextInputValue('inputEmoji');

		if(!emoji) {
			voiceChannel.setName(makePVSessionName(name)).catch(console.error);
			return interaction.editReply({ content: '✅ Nombre aplicado' });
		}

		const defEmoji = defaultEmoji(emoji);
		if(!defEmoji)
			return interaction.reply({ content: '⚠️ El emoji indicado no es un emoji Unicode válido' });
		
		voiceChannel.setName(makePVSessionName(name, defEmoji)).catch(console.error);
		return interaction.editReply({ content: '✅ Nombre aplicado' });
	})
	.setButtonResponse(async function freezeSession(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const { member } = interaction;
        const translator = await Translator.from(member);

		const warnNotInSession = () => interaction.editReply({
			content: '⚠️ Debes entrar a una sesión PuréVoice para realizar esta acción',
		}).catch(console.error);

		const voiceState = member.voice;
		if(!voiceState) return warnNotInSession();

		const voiceChannel = voiceState.channel;
		if(!voiceChannel) return warnNotInSession();

		const session = await PureVoiceSessionModel.findOne({ channelId: voiceChannel.id });
		if(!session) return warnNotInSession();

		const sessionMember = new PureVoiceSessionMember(session.members.get(member.id) ?? {});
		if(sessionMember.isGuest())
			return interaction.editReply({
				content: '❌ Solo el administrador y los moderadores de una sesión PuréVoice pueden congelarla',
			});

		session.frozen = !session.frozen;

		const allowedMembers = getFrozenSessionAllowedMembers(voiceChannel, session.members);
		const userLimit = session.frozen ? allowedMembers.size : 0;

		for(const [ memberId, member ] of allowedMembers) {
			session.members.set(memberId, member.setWhitelisted(true).toJSON());
			await voiceChannel.permissionOverwrites.edit(memberId, { Connect: true }, { reason: 'PLACEHOLDER_PV_REASON_FREEZE_CONNECT_ENABLE' }).catch(console.error);
		}

		session.markModified('members');

		await Promise.all([
			voiceChannel.setUserLimit(userLimit, `Actualizar límite de usuarios de sesión PuréVoice ${session.frozen ? 'congelada' : 'descongelada'}`).catch(console.error),
			voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false }, { reason: 'PLACEHOLDER_PV_REASON_FREEZE_CONNECT_DISABLE' }).catch(console.error),
			session.save(),
		]);
		
		return interaction.editReply({
			content: `❄️ La sesión ${voiceChannel} fue **${session.frozen ? 'congelada' : 'descongelada'}**`,
		});
	})
	.setButtonResponse(async function showMeHow(interaction) {
		const commandName = `${p_pure(interaction.guildId).raw}voz`;
		return interaction.reply({
			content: [
				'Ejemplos:',
				`> ${commandName}  Gaming   --emote  🎮`,
				`> ${commandName}  Noche de Acapella   -e  🎤`,
				`> ${commandName}  --emoji  🎧   Música de Fondo`,
				`> ${commandName}  -e  🎉   Aniversario`,
				'Resultados:',
				`> 🎮【Gaming】`,
				`> 🎤【Noche de Acapella】`,
				`> 🎧【Música de Fondo】`,
				`> 🎉【Aniversario】`,
			].join('\n'),
			ephemeral: true,
		});
	});

/**
 * @param {String} iconUrl
 * @param {String} stepName
 * @param {import('discord.js').ColorResolvable} stepColor
 */
function wizEmbed(iconUrl, stepName, stepColor) {
	return new EmbedBuilder()
		.setColor(stepColor)
		.setAuthor({ name: 'Asistente de Configuración de Sistema PuréVoice', iconURL: iconUrl })
		.setFooter({ text: stepName });
}

/**
 * @param {import('../Commons/typings.js').ComplexCommandRequest} request
 * @param {Translator} translator
 */
function generateFirstWizard(request, translator) {
	if(isNotModerator(request.member)) return request.reply({ content: translator.getText('insufficientPermissions'), ephemeral: true });
	const wizard = wizEmbed(request.client.user.avatarURL(), '1/? • Comenzar', Colors.Aqua)
		.addFields({
			name: translator.getText('welcome'),
			value: 'Si es la primera vez que configuras un Sistema PuréVoice, ¡no te preocupes! Solo sigue las instrucciones del Asistente y adapta tu Feed a lo que quieras',
		});
	const uid = request.userId;
	return request.reply({
		embeds: [wizard],
		components: [new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`voz_startWizard_${uid}`)
				.setLabel('Comenzar')
				.setStyle(ButtonStyle.Primary),
			cancelbutton(uid),
		)],
	});
}

module.exports = command;