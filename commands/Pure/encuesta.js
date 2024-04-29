const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonInteraction, ModalSubmitInteraction, ChannelType, ActionRow } = require('discord.js');
const { compressId, decompressId, shortenText, fetchChannel, toPrecision, improveNumber, clamp } = require('../../func.js');
const { Translator } = require('../../internationalization.js');
const { CommandManager } = require('../Commons/cmdBuilder.js');
const { CommandTags } = require('../Commons/cmdTags.js');
const { CommandOptions } = require('../Commons/cmdOpts.js');
const Poll = require('../../localdata/models/poll.js');
const { CommandPermissions } = require('../Commons/cmdPerms.js');

/**
 * @typedef {{ question?: string, answers: Map<string, string>, endTime: number, anon: Boolean }} PollMemory
 */

/**
 * @param {Number} stepCount
 * @param {import('../../internationalization').LocaleIds} stepName
 * @param {import('discord.js').ColorResolvable} stepColor
 * @param {Translator} translator
 */
const wizEmbed = (iconUrl, stepName, stepColor, translator) => {
    return new EmbedBuilder()
        .setColor(stepColor)
        .setAuthor({ name: translator.getText('pollWizardAuthor'), iconURL: iconUrl })
        .setFooter({ text: translator.getText(stepName) });
};

/**
 * @param {String} id
 * @param {Translator} translator
 */
const cancelButton = (id, translator) => new ButtonBuilder()
	.setCustomId(`poll_cancelWizard_${id}`)
	.setLabel(translator.getText('buttonCancel'))
	.setStyle(ButtonStyle.Secondary);

/**
 * @param {CommandManager} cmd
 * @param {import('discord.js').Interaction} interaction
 * @param {String} requestId
 * @param {Translator} translator
 */
function getAnswersPageData(cmd, interaction, requestId, translator) {
	/**@type {PollMemory}*/
	const pollMemory = cmd.memory.get(requestId);
	if(!pollMemory)
		return ({ content: translator.getText('expiredWizardData') });

	const userId = compressId(interaction.user.id);
	const embed = wizEmbed(interaction.guild.iconURL() ?? interaction.client.user.avatarURL(), 'pollAnswersFooterName', Colors.Navy, translator)
		.addFields(
			{
				name: translator.getText('pollQuestion'),
				value: pollMemory.question ?? 'ERROR INESPERADO',
			},
			{
				name: translator.getText('pollAnswersName'),
				value: pollMemory.answers.size ? [...pollMemory.answers.entries()].map(([ n, d ]) => `**${n}**: "${shortenText(d, 80)}"`).join('\n') : translator.getText('pollAnswersValueEmpty'),
			},
		);
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`poll_finishConfig_${userId}_${requestId}`)
			.setLabel(translator.getText('buttonCreate'))
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`poll_addAnswerShow_${userId}_${requestId}`)
			.setEmoji('1051265601152229436')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId(`poll_rmAnswerShow_${userId}_${requestId}`)
			.setEmoji('1051265954312617994')
			.setStyle(ButtonStyle.Danger),
		cancelButton(userId, translator),
	);

	return {
		embeds: [embed],
		components: [row],
	};
}

/**
 * @param {CommandManager} cmd
 * @param {import('discord.js').Interaction} interaction
 * @param {String} requestId
 * @param {Translator} translator
 */
function getFinishPageData(cmd, interaction, requestId, translator) {
	/**@type {PollMemory}*/
	const pollMemory = cmd.memory.get(requestId);
	if(!pollMemory)
		return ({ content: translator.getText('expiredWizardData') });

	const time    = pollMemory.endTime;
	const hours   = Math.floor(time / 60 ** 2);
	const minutes = Math.floor(time / 60 % 60);
	const seconds = time % 60;

	const userId = compressId(interaction.user.id);
	const embed = wizEmbed(interaction.guild.iconURL() ?? interaction.client.user.avatarURL(), 'pollFinishFooterName', Colors.Navy, translator)
		.setTitle(translator.getText('pollFinishTitle'))
		.addFields({
				name: translator.getText('pollFinishTimeName'),
				value: `\`\`\`rust\n${hours}º ${minutes}' ${improveNumber(seconds)}"\n\`\`\``,
		});
	const mainRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`poll_beginPollShow_${userId}_${requestId}`)
			.setLabel(translator.getText('pollFinishButtonBegin'))
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`poll_toggleAnon_${userId}_${requestId}`)
			.setLabel(translator.getText('pollButtonToggleAnon'))
			.setStyle(pollMemory.anon ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(`poll_goToAnswersPage_${userId}_${requestId}`)
			.setLabel(translator.getText('buttonBack'))
			.setStyle(ButtonStyle.Secondary),
		cancelButton(userId, translator),
	);
	const timeRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`poll_setTimeShow_2_${userId}_${requestId}`)
			.setLabel(translator.getText('hours') + '...')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId(`poll_setTimeShow_1_${userId}_${requestId}`)
			.setLabel(translator.getText('minutes') + '...')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId(`poll_setTimeShow_0_${userId}_${requestId}`)
			.setLabel(translator.getText('seconds') + '...')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId(`poll_resetTime_${userId}_${requestId}`)
			.setLabel(translator.getText('pollFinishButtonReset'))
			.setStyle(ButtonStyle.Danger),
	);

	return ({
		embeds: [embed],
		components: [mainRow, timeRow],
	});
}

/**
 * 
 * @param {ButtonInteraction} interaction 
 * @param {String} authorId 
 * @param {String} requestId 
 * @param {Boolean?} add 
 */
async function showAnswerModal(interaction, authorId, requestId, add) {
	const translator = await Translator.from(interaction.user.id);

	if(interaction.user.id !== decompressId(authorId))
		return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

	const rows = [];

	rows.push(new ActionRowBuilder().addComponents(
		new TextInputBuilder()
			.setCustomId('answerInput')
			.setLabel(translator.getText('pollAnswerPromptInput'))
			.setMinLength(1)
			.setMaxLength(60)
			.setStyle(TextInputStyle.Short)
	));

	if(add)
		rows.push(new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('descInput')
				.setLabel(translator.getText('description'))
				.setRequired(false)
				.setMaxLength(256)
				.setStyle(TextInputStyle.Paragraph)
		));

	const modal = new ModalBuilder()
		.setCustomId(`poll_${add ? 'addAnswer' : 'rmAnswer'}_${requestId}`)
		.setTitle(translator.getText(add ? 'pollAnswerPromptTitleAdd' : 'pollAnswerPromptTitleRemove'))
		.addComponents(...rows);

	return interaction.showModal(modal);
}

/**
 * 
 * @param {CommandManager} cmd 
 * @param {ModalSubmitInteraction} interaction 
 * @param {String} requestId 
 * @param {Boolean?} add 
 */
async function setAnswer(cmd, interaction, requestId, add) {
	const translator = await Translator.from(interaction.user.id);
	
	/**@type {PollMemory}*/
	const pollMemory = cmd.memory.get(requestId);
	if(!pollMemory)
		return ({ content: translator.getText('expiredWizardData') });

	const name = interaction.fields.getTextInputValue('answerInput');

	if(add)
		pollMemory.answers.set(name, interaction.fields.getTextInputValue('descInput'));
	else
		pollMemory.answers.delete(name);

	return interaction.update(getAnswersPageData(cmd, interaction, requestId, translator));
}

/**
 * @param {ButtonInteraction} interaction 
 * @param {import('mongoose').Document} poll
 * @param {Number} voteId
 */
function sendVoteRegistry(interaction, poll, voteId) {
	const channel = fetchChannel(poll.resultsChannelId, interaction.guild);
	if(!channel)
		return;
	
	const pollTranslator = new Translator(poll.locale);
	const voteEmbed = new EmbedBuilder()
		.setColor(Colors.Blue)
		.setAuthor({ name: pollTranslator.getText('pollVoteReportAuthor'), iconURL: interaction.guild.iconURL({ size: 128 }) })
		.setTitle(poll.question)
		.setThumbnail(interaction.user.avatarURL({ size: 256 }))
		.setFooter({ text: `UID: ${interaction.user.id}` })
		.addFields(
			{
				name: interaction.user.tag,
				value: poll.answers[voteId] ?? pollTranslator.getText('pollVoteReportDeleted'),
				inline: true,
			},
		);
	channel.send({ embeds: [voteEmbed] });
}

/**
 * 
 * @param {import('discord.js').Channel} resultsChannel 
 * @param {String} pollId 
 * @returns 
 */
async function concludePoll(pollChannel, resultsChannel, pollId) {
	const poll = await Poll.findOne({ id: pollId });
	const translator = new Translator(poll.locale);

	if(!poll || !pollChannel || !resultsChannel)
		return;

	//Crea un mapa de recuento de ids y las ordena según cuáles fueron más elegidas
	/**@type {Map<String, Number>}*/
	let voteIds = new Map();
	for(let voteId of poll.votes.values()) 
		voteIds.set(voteId, (voteIds.get(voteId) ?? 0) + 1);
	voteIds = new Map(
		[...voteIds.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
	);

	const results = [];
	for(let [voteId, count] of voteIds.entries()) {
		const answer = poll.answers[voteId];
		const percent = count / poll.votes.size * 100;
		results.push(`**${answer}** • ${count} _(${improveNumber(percent, false)}%)_`);
	}

	if(!results) {
		const pollReply = { content: `No se recibieron votos para la encuesta **"${poll.question}"**...` };
		const sends = [ pollChannel.send(pollReply) ];
		if(resultsChannel.id !== pollChannel.id)
			sends.push(resultsChannel.send(pollReply));
		return Promise.all(sends);
	}

	const embed = new EmbedBuilder()
		.setAuthor({ name: translator.getText('pollResultsAuthor'), iconURL: pollChannel.guild.iconURL() })
		.setTitle(poll.question)
		.setColor(Colors.Fuchsia)
		.setFooter({ text: translator.getText('pollConcludedStepFooterName') })
		.addFields({
			name: translator.getText('pollResultsName'),
			value: results.join('\n'),
			inline: true,
		});

	poll.delete();
	return Promise.all([
		pollChannel.send({ embeds: [embed] }),
		resultsChannel.send({ embeds: [embed] }),
	]);
}

const perms = new CommandPermissions([ 'ManageGuild', 'ManageChannels', 'ManageRoles', 'ModerateMembers', 'KickMembers', 'BanMembers' ]);
const options = new CommandOptions();
const flags = new CommandTags().add('MOD', 'OUTDATED');
const command = new CommandManager('encuesta', flags)
	.setAliases(
		'votación', 'votacion', 'voto',
		'poll',
	)
	.setBriefDescription('Crea una encuesta con opciones emparejadas con emotes')
	.setLongDescription(
		'Crea una encuesta con opciones',
		'Crea una encuesta con `<opciones>` que comienzan y se separan con emotes. Los emotes serán lo que se usará para votar',
		'Si así lo deseas, puedes adherir una `--pregunta` y delegar el `--canal` al cual enviar la encuesta',
		'Debido a la naturaleza de las votaciones, no podrás editar ningún aspecto de la encuesta una vez ya esté enviada. Si cometes un error, bórrala y usa el comando nuevamente',
		'Por defecto, el periodo de votación es un minuto. Puedes cambiarlo en `--horas`, `--minutos` y `--segundos`',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async function(request) {
		const translator = await Translator.from(request.userId);

		/**@type {PollMemory}*/
		const pollMemory = { answers: new Map(), endTime: 0, anon: false };
		const requestId = compressId(request.id);
		this.memory.set(requestId, pollMemory);

		const embed = wizEmbed(request.guild.iconURL() ?? request.client.user.avatarURL(), 'cancelledStepFooterName', Colors.Fuchsia, translator)
			.setColor('Fuchsia')
			.addFields({
				name: translator.getText('welcome'),
				value: translator.getText('pollWelcomeValue'),
			});

		const userId = compressId(request.userId);
		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`poll_setNameShow_${userId}_${requestId}`)
				.setLabel(translator.getText('buttonStart'))
				.setStyle(ButtonStyle.Primary),
			cancelButton(userId, translator),
		);

		return request.reply({
			embeds: [embed],
			components: [row],
		});
	})
	.setButtonResponse(async function setNameShow(interaction, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		const row = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('questionInput')
				.setLabel(translator.getText('pollQuestion'))
				.setMinLength(1)
				.setMaxLength(256)
				.setStyle(TextInputStyle.Short)
		);
	
		const modal = new ModalBuilder()
			.setCustomId(`poll_setName_${requestId}`)
			.setTitle(translator.getText('pollQuestionPromptTitle'))
			.addComponents(row);
	
		return interaction.showModal(modal);
	})
	.setModalResponse(async function setName(interaction, requestId) {
		const translator = await Translator.from(interaction.user.id);

		/**@type {PollMemory}*/
		const pollMemory = this.memory.get(requestId);
		if(!pollMemory)
			return ({ content: translator.getText('expiredWizardData') });

		pollMemory.question = interaction.fields.getTextInputValue('questionInput');

		return interaction.update(getAnswersPageData(this, interaction, requestId, translator));
	})
	.setButtonResponse(async function goToAnswersPage(interaction, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		return interaction.update(getAnswersPageData(this, interaction, requestId, translator));
	})
	.setButtonResponse(async function addAnswerShow(interaction, authorId, requestId) {
		return showAnswerModal(interaction, authorId, requestId, true);
	})
	.setButtonResponse(async function rmAnswerShow(interaction, authorId, requestId) {
		return showAnswerModal(interaction, authorId, requestId, false);
	})
	.setModalResponse(async function addAnswer(interaction, requestId) {
		return setAnswer(this, interaction, requestId, true);
	})
	.setModalResponse(async function rmAnswer(interaction, requestId) {
		return setAnswer(this, interaction, requestId, false);
	})
	.setButtonResponse(async function finishConfig(interaction, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		return interaction.update(getFinishPageData(this, interaction, requestId, translator));
	})
	.setButtonResponse(async function setTimeShow(interaction, index, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		/**@type {Array<import('../../internationalization.js').LocaleIds>}*/
		const localeIds = [ 'seconds', 'minutes', 'hours' ];
		const localeId = localeIds[+index];

		const row = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('timeInput')
				.setLabel(translator.getText(localeId))
				.setMinLength(1)
				.setMaxLength(5)
				.setPlaceholder('3, 0.5, -1, etc')
				.setStyle(TextInputStyle.Short)
		);
	
		const modal = new ModalBuilder()
			.setCustomId(`poll_setTime_${index}_${requestId}`)
			.setTitle(translator.getText('pollTimePromptTitle'))
			.addComponents(row);
	
		return interaction.showModal(modal);
	})
	.setModalResponse(async function setTime(interaction, index, requestId) {
		const translator = await Translator.from(interaction.user.id);

		const timeMagnitude = +interaction.fields.getTextInputValue('timeInput');
		if(isNaN(timeMagnitude))
			return ({ content: translator.getText('invalidTime') });

		const timeUnitSeconds = 60 ** index;
		const seconds = timeMagnitude * timeUnitSeconds;

		/**@type {PollMemory}*/
		const pollMemory = this.memory.get(requestId);
		if(!pollMemory)
			return ({ content: translator.getText('expiredWizardData') });

		pollMemory.endTime = clamp(pollMemory.endTime + seconds, 0, 9999 * 60 ** 2);
		
		return interaction.update(getFinishPageData(this, interaction, requestId, translator));
	})
	.setButtonResponse(async function resetTime(interaction, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		/**@type {PollMemory}*/
		const pollMemory = this.memory.get(requestId);
		if(!pollMemory)
			return ({ content: translator.getText('expiredWizardData') });

		pollMemory.endTime = 0;
		
		return interaction.update(getFinishPageData(this, interaction, requestId, translator));
	})
	.setButtonResponse(async function toggleAnon(interaction, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		/**@type {PollMemory}*/
		const pollMemory = this.memory.get(requestId);
		if(!pollMemory)
			return ({ content: translator.getText('expiredWizardData') });

		pollMemory.anon = !pollMemory.anon;
		
		return interaction.update(getFinishPageData(this, interaction, requestId, translator));
	})
	.setButtonResponse(async function beginPollShow(interaction, authorId, requestId) {
		const translator = await Translator.from(interaction.user.id);

		if(interaction.user.id !== decompressId(authorId))
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });

		/**@type {PollMemory}*/
		const pollMemory = this.memory.get(requestId);
		if(pollMemory.endTime < 10)
			return interaction.reply({ content: translator.getText('pollInsufficientTime'), ephemeral: true });

		const channelRow = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('pollChannelInput')
				.setLabel(translator.getText('pollChannelPollLabel'))
				.setPlaceholder(translator.getText('pollChannelPollPlaceholder'))
				.setMinLength(1)
				.setMaxLength(128)
				.setStyle(TextInputStyle.Short)
		);
		const resultsChannelRow = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId('resultsChannelInput')
				.setLabel(translator.getText('pollChannelResultsLabel'))
				.setPlaceholder(translator.getText('pollChannelResultsPlaceholder'))
				.setRequired(false)
				.setMaxLength(128)
				.setStyle(TextInputStyle.Short)
		);
	
		const modal = new ModalBuilder()
			.setCustomId(`poll_beginPoll_${requestId}`)
			.setTitle(translator.getText('pollChannelPromptTitle'))
			.addComponents(channelRow, resultsChannelRow);
	
		return interaction.showModal(modal);
	})
	.setModalResponse(async function beginPoll(interaction, requestId) {
		const [ translator ] = await Promise.all([
			Translator.from(interaction.user.id),
			interaction.deferUpdate(),
		]);

		const acceptedChannels = [
			ChannelType.GuildText,
			ChannelType.GuildVoice,
			ChannelType.PublicThread,
		];

		const pollChannelSearch = interaction.fields.getTextInputValue('pollChannelInput');
		const pollChannel = fetchChannel(pollChannelSearch, interaction.guild);
		if(!pollChannel || !acceptedChannels.includes(pollChannel.type))
			return interaction.editReply({ content: `${translator.getText('invalidChannel')} (${pollChannelSearch})` });

		let resultsChannel = interaction.channel;
		const resultsChannelSearch = interaction.fields.getTextInputValue('resultsChannelInput');
		if(resultsChannelSearch.length) {
			resultsChannel = fetchChannel(resultsChannelSearch, interaction.guild);
			if(!resultsChannel || !acceptedChannels.includes(resultsChannel.type))
				return interaction.editReply({ content: `${translator.getText('invalidChannel')} (${resultsChannelSearch})` });
		}

		/**@type {PollMemory}*/
		const pollMemory = this.memory.get(requestId);
		if(!pollMemory)
			return ({ content: translator.getText('expiredWizardData') });
		const pollId = compressId(interaction.id);

		/**@type {Array<ActionRowBuilder>}*/
		const components = [];
		/**@type {Array<String>}*/
		const answerValues = [];
		const seconds = pollMemory.endTime;
		const timestamp = Date.now() + Math.round(seconds * 1000);
		const pollEmbed = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setTitle(pollMemory.question)
			.setAuthor({ name: translator.getText('poll'), iconURL: interaction.guild.iconURL() })
			.setFooter({ text: translator.getText('pollOngoingStepFooterName') })
			.addFields({ name: translator.getText('pollEndTimeName'), value: `<t:${Math.round(timestamp / 1000)}:R>` });
		/**@type {ActionRowBuilder}*/
		let currentComponent;
		let added = 0;

		for(const [ answer, desc ] of pollMemory.answers.entries()) {
			if(added === 0)
				currentComponent = new ActionRowBuilder();

			currentComponent.addComponents(
				new ButtonBuilder()
					.setCustomId(`poll_vote_${answerValues.length}_${pollId}`)
					.setLabel(answer)
					.setStyle(ButtonStyle.Primary),
			);
			answerValues.push(answer);
			
			added++;
			if(added === 5) {
				components.push(currentComponent);
				added = 0;
			}

			pollEmbed.addFields({
				name: answer,
				value: desc.length ? desc : 'Respuesta',
				inline: true,
			});
		}

		const removeButton = new ButtonBuilder()
			.setCustomId(`poll_vote_-1_${pollId}`)
			.setLabel('Remover voto')
			.setStyle(ButtonStyle.Danger);
		currentComponent.addComponents(removeButton);
		components.push(currentComponent);
		
		const timeUntil = timestamp - Date.now()
		const poll = new Poll({
			id: pollId,
			pollChannelId: pollChannel.id,
			resultsChannelId: resultsChannel.id,
			end: timestamp,
			anon: pollMemory.anon,
			locale: translator.locale,
			question: pollMemory.question,
			answers: answerValues,
		});
		setTimeout(concludePoll, timeUntil, pollChannel, resultsChannel, pollId);
		
		try {
			await pollChannel.send({
				embeds: [pollEmbed],
				components,
			});
			await poll.save();

			const embed = wizEmbed(interaction.guild.iconURL({ size: 256 }), 'finishedStepFooterName', Colors.DarkAqua, translator)
				.setDescription(translator.getText('pollFinishedStep'));

			return interaction.editReply({ content: null, embeds: [embed], components: [] });
		} catch(e) {
			return interaction.editReply({ content: '⚠️ Error' });
		}
	})
	.setButtonResponse(async function vote(interaction, voteId, pollId) {
		const userId = compressId(interaction.user.id);
		const [ translator, poll ] = await Promise.all([
			Translator.from(interaction.user.id),
			Poll.findOne({ id: pollId }),
		]);

		if(!poll)
			return interaction.reply({ content: translator.getText('pollVoteError'), ephemeral: true });

		/**@type {import('../../internationalization.js').LocaleIds}*/
		let localeId;
		voteId = +voteId;
		if(voteId < 0) {
			localeId = 'pollVoteRemoveSuccess';
			poll.votes.delete(userId);
		} else {
			localeId = poll.votes.has(userId) ? 'pollVoteSwapSuccess' : 'pollVoteSuccess';
			poll.votes.set(userId, voteId);
		}

		poll.markModified('votes');
		await poll.save();
		if(!poll.anon)
			sendVoteRegistry(interaction, poll, voteId);

		return interaction.reply({ content: translator.getText(localeId), ephemeral: true });
	})
	.setButtonResponse(async function cancelWizard(interaction, authorId) {
        const translator = await Translator.from(interaction.user.id);
		authorId = decompressId(authorId);

		if(interaction.user.id !== authorId)
			return interaction.reply({ content: translator.getText('unauthorizedInteraction'), ephemeral: true });
		
		const cancelEmbed = wizEmbed(interaction.guild.iconURL() ?? interaction.client.user.avatarURL(), 'cancelledStepFooterName', Colors.NotQuiteBlack, translator)
			.addFields({
				name: translator.getText('cancelledStepName'),
				value: translator.getText('pollCancelledStep'),
			});
		return interaction.update({
            content: null,
			embeds: [cancelEmbed],
			components: [],
		});
	})
	.setFunction(concludePoll);

module.exports = command;