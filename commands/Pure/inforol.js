const Discord = require('discord.js'); //Integrar discord.js
const { compressId } = require('../../func');
const { p_pure } = require('../../localdata/customization/prefixes.js');
const { CommandOptions, CommandTags, CommandManager, CommandOptionSolver } = require('../Commons/commands');
const { CommandPermissions } = require('../Commons/cmdPerms.js');
const { Translator } = require('../../internationalization');
const { makeButtonRowBuilder } = require('../../tsCasts');

const MEMBERS_PER_PAGE = 10;

const perms = new CommandPermissions('ManageRoles');
const options = new CommandOptions()
	.addParam('términos', 'ROLE', 'para especificar los roles que quieres buscar', { poly: 'MULTIPLE', polymax: 8 })
	.addFlag('xe', ['estricta', 'estricto', 'exclusivo'], 'para especificar si la búsqueda es estricta');
const flags = new CommandTags().add('MOD');
const command = new CommandManager('inforol', flags)
	.setAliases(
		'cuántos', 'cuantos', 'cuentarol',
        'rolecount', 'roleinfo',
        'irol', 'ir', 'ri', 'rolei',
	)
	.setBriefDescription('Realiza una búsqueda de roles en el servidor. Muestra la cantidad y una lista de usuarios')
	.setLongDescription(
		'Realiza una búsqueda en el servidor para encontrar a todos los usuarios que cumplen con los búsqueda de roles solicitada.',
		'Devuelve el total de usuarios encontrados junto con una lista paginada de los mismos',
		'Si la búsqueda es `--estricta`, solo se listarán los usuarios que tengan _todos_ los roles mencionados, en lugar de _uno o más_.',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExperimentalExecution(async (request, args) => {
		const translator = await Translator.from(request.user);
		
		if(args.empty)
			return request.reply({ content: `❌ ¡Debes indicar al menos un rol!\nUsa \`${p_pure(request.guildId).raw}ayuda inforol\` para más información` });

		const strict = args.parseFlag('estricta');
		const roles = CommandOptionSolver.asRoles(args.parsePolyParamSync('términos', { regroupMethod: 'MENTIONABLES-WITH-SEP' }));

		const roleIds = roles.map(role => role.id);
		if(!roleIds.length)
			return request.reply({ content: '⚠️ No se encontró ningún rol...', ephemeral: true });

		const members = request.guild.members.cache.filter(member =>
			strict
				? roleIds.every(arg => member.roles.cache.has(arg))
				: roleIds.some(arg => member.roles.cache.has(arg))
		);
        const query = { strict, roles, members };
		const requestId = compressId(request.id);
		command.memory.set(requestId, query);

		return showInforolPage(request, 0, requestId, query);
	}).setButtonResponse(async function showPage(interaction, page, requestId) {
		const query = command.memory.get(requestId);

		if(!query) {
			const translator = await Translator.from(interaction.user);
			return interaction.reply({ content: translator.getText('expiredWizardData') });
		}

		return showInforolPage(interaction, +page, requestId, query);
	}, { userFilterIndex: 2 });

/**
 * @param {import('../Commons/typings').ComplexCommandRequest | Discord.ButtonInteraction<'cached'>} request
 * @param {Number} page
 * @param {String} requestId
 * @param {{ strict: Boolean, roles: Array<Discord.Role>, members: Discord.Collection<String, Discord.GuildMember> }} query
 */
function showInforolPage(request, page, requestId, query) {
	const { strict, roles, members } = query;
	const { guild, user } = request;

	const isCommand = compressId(request.id) === requestId;

	/**@param {Discord.MessagePayload | (Discord.InteractionReplyOptions & Discord.InteractionUpdateOptions)} replyBody*/
	const replyOrUpdate = (replyBody) => isCommand ? (request.reply(replyBody)) : (/**@type {Discord.ButtonInteraction}*/(request).update(replyBody));
	
	const membersCount = members.size;
	if(!membersCount)
		return replyOrUpdate({ content: '⚠️ No se encontró ningún miembro...', ephemeral: true });

	const lastPage = Math.ceil(membersCount / MEMBERS_PER_PAGE);
	const previousPage = page > 0 ? (page - 1) : lastPage;
	const nextPage = page < lastPage ? (page + 1) : 0;
	
	const authorId = compressId(user.id);
	const components = [makeButtonRowBuilder().addComponents(
			new Discord.ButtonBuilder()
				.setCustomId(`inforol_showPage_0_${requestId}_${authorId}_F`)
				.setEmoji('1087075525245272104')
				.setStyle(Discord.ButtonStyle.Primary),
			new Discord.ButtonBuilder()
				.setCustomId(`inforol_showPage_${previousPage}_${requestId}_${authorId}_P`)
				.setEmoji('934430008343158844')
				.setStyle(Discord.ButtonStyle.Secondary),
			new Discord.ButtonBuilder()
				.setCustomId(`inforol_showPage_${nextPage}_${requestId}_${authorId}_N`)
				.setEmoji('934430008343158844')
				.setStyle(Discord.ButtonStyle.Secondary),
		)];
	
	let embed;
	if(page === 0) {
		const botsCount = members.filter(member => member.user.bot).size;
		const humansCount = membersCount - botsCount;
		const rolesContent = roles.map(r => `${r}`).join(', ');
		
		embed = new Discord.EmbedBuilder()
			.setColor(0xff00ff)
			.setTitle(`Análisis del roles (Total)`)
			.addFields(
				{ name: 'Roles en análisis', value: rolesContent },
				{ name: 'Caso', value: `**${strict ? 'Estricto' : 'Flojo'}**`, inline: true },
				{ name: 'Cuenta total', value: `:wrestlers: x ${humansCount}\n:robot: x ${botsCount}`, inline: true },
			)
			.setThumbnail(guild.iconURL({ size: 256 }))
			.setAuthor({ name: `Comando invocado por ${user.username}`, iconURL: user.avatarURL() })
			.setFooter({ text: `Página principal` });
	
		return replyOrUpdate({
			embeds: [embed],
			components,
		});
	} else {
		const pageStart = (page - 1) * MEMBERS_PER_PAGE;
		const pageEnd = pageStart + MEMBERS_PER_PAGE;
	
		const memberListContent = members
			.map(m => m.user.bot ? `${m} (🤖)` : `${m}`)
			.slice(pageStart, pageEnd)
			.join('\n');
	
		embed = new Discord.EmbedBuilder()
			.setColor(0xff00ff)
			.setTitle('Análisis del roles (Detalle)')
			.setAuthor({ name: `Comando invocado por ${user.username}`, iconURL: user.avatarURL() })
			.setFooter({ text: `Página de lista ${page}/${lastPage}` })
			.addFields({ name: 'Lista de usuarios', value: memberListContent });
	}

	return replyOrUpdate({
		content: '',
		embeds: [embed],
		components,
	});
}

module.exports = command;
