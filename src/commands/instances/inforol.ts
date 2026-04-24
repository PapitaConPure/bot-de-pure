import type { ButtonInteraction, Collection, GuildMember, Role } from 'discord.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
} from 'discord.js';
import type { ComplexCommandRequest } from 'types/commands';
import { Translator } from '@/i18n';
import { getBotEmojiResolvable } from '@/utils/emojis';
import { compressId } from '@/utils/encoding';
import { fetchGuildMembers } from '@/utils/guildratekeeper';
import { Command, CommandOptionSolver, CommandOptions, CommandTags } from '../commons';
import { CommandPermissions } from '../commons/cmdPerms';

const MEMBERS_PER_PAGE = 10;

interface InforolQuery {
	strict: boolean;
	roles: Role[];
	members: Collection<string, GuildMember>;
}

const perms = new CommandPermissions('ManageRoles');
const options = new CommandOptions()
	.addParam('términos', 'ROLE', 'para especificar los roles que quieres buscar', {
		poly: 'MULTIPLE',
		polymax: 8,
	})
	.addFlag(
		'xe',
		['estricta', 'estricto', 'exclusivo'],
		'para especificar si la búsqueda es estricta',
	);

const flags = new CommandTags().add('MOD');
const command = new Command(
	{
		es: 'info-rol',
		en: 'role-info',
		ja: 'role-info',
	},
	flags,
)
	.setAliases(
		'cuántos',
		'cuantos',
		'cuentarol',
		'rolecount',
		'roleinfo',
		'irol',
		'ir',
		'ri',
		'rolei',
	)
	.setBriefDescription(
		'Realiza una búsqueda de roles en el servidor. Muestra la cantidad y una lista de usuarios',
	)
	.setLongDescription(
		'Realiza una búsqueda en el servidor para encontrar a todos los usuarios que cumplen con los búsqueda de roles solicitada.',
		'Devuelve el total de usuarios encontrados junto con una lista paginada de los mismos',
		'Si la búsqueda es `--estricta`, solo se listarán los usuarios que tengan _todos_ los roles mencionados, en lugar de _uno o más_.',
	)
	.setPermissions(perms)
	.setOptions(options)
	.setExecution(async (request, args) => {
		const [translator] = await Promise.all([
			await Translator.from(request),
			fetchGuildMembers(request.guild),
		]);

		if (args.empty)
			return request.reply({ content: translator.getText('inforolNoRoleProvided') });

		const strict = args.hasFlag('estricta');
		const roles = CommandOptionSolver.asRoles(
			args.parsePolyParamSync('términos', { regroupMethod: 'MENTIONABLES-WITH-SEP' }),
		);

		const roleIds = roles.map((role) => role?.id);
		if (!roleIds.length || roles.some((role) => role == null))
			return request.reply({
				content: translator.getText('invalidRole'),
				flags: MessageFlags.Ephemeral,
			});

		const members = request.guild.members.cache.filter((member) => {
			const rolesCache = member.roles.cache;
			return strict
				? roleIds.every((arg) => arg && rolesCache.has(arg))
				: roleIds.some((arg) => arg && rolesCache.has(arg));
		});
		const query = { strict, roles: roles as Role[], members };
		const requestId = compressId(request.id);
		command.memory.set(requestId, query);

		return showInforolPage(request, 0, requestId, translator, query);
	})
	.setButtonResponse(
		async function showPage(interaction, page, requestId) {
			const translator = await Translator.from(interaction.user);

			const query = command.memory.get(requestId) as InforolQuery;
			if (!query)
				return interaction.reply({ content: translator.getText('expiredWizardData') });

			return showInforolPage(interaction, +page, requestId, translator, query);
		},
		{ userFilterIndex: 2 },
	);

function showInforolPage(
	request: ComplexCommandRequest | ButtonInteraction<'cached'>,
	page: number,
	requestId: string,
	translator: Translator,
	query: InforolQuery,
) {
	const { strict, roles, members } = query;
	const { guild, user } = request;

	const isCommand = compressId(request.id) === requestId;

	const replyOrUpdate = (options: {
		content?: string;
		embeds?: EmbedBuilder[];
		components?: ActionRowBuilder<ButtonBuilder>[];
	}) =>
		isCommand
			? (request as ComplexCommandRequest).reply({
					flags: MessageFlags.Ephemeral,
					...options,
				})
			: (request as ButtonInteraction).update(options);

	const membersCount = members.size;
	if (!membersCount)
		return {
			content: translator.getText('inforolNoMembersFound'),
		};

	const lastPage = Math.ceil(membersCount / MEMBERS_PER_PAGE);
	const previousPage = page > 0 ? page - 1 : lastPage;
	const nextPage = page < lastPage ? page + 1 : 0;

	const authorId = compressId(user.id);
	const components = [
		new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`inforol_showPage_0_${requestId}_${authorId}_F`)
				.setEmoji(getBotEmojiResolvable('eyeWhite'))
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`inforol_showPage_${previousPage}_${requestId}_${authorId}_P`)
				.setEmoji(getBotEmojiResolvable('navPrevAccent'))
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`inforol_showPage_${nextPage}_${requestId}_${authorId}_N`)
				.setEmoji(getBotEmojiResolvable('navNextAccent'))
				.setStyle(ButtonStyle.Secondary),
		),
	];

	let embed: EmbedBuilder;
	if (page === 0) {
		const botsCount = members.filter((member) => member.user.bot).size;
		const humansCount = membersCount - botsCount;
		const rolesContent = roles.map((r) => `${r}`).join(', ');

		embed = new EmbedBuilder()
			.setColor(0xff00ff)
			.setTitle(translator.getText('inforolDashboardTitle'))
			.setThumbnail(guild.iconURL({ size: 256 }))
			.setAuthor({
				name: translator.getText('commandByName', user.username),
				iconURL: user.displayAvatarURL(),
			})
			.setFooter({ text: translator.getText('inforolDashboardFooter') })
			.addFields(
				{ name: translator.getText('inforolDashboardRolesListName'), value: rolesContent },
				{
					name: translator.getText('inforolDashboardCaseName'),
					value: translator.getText('inforolDashboardCaseValue', strict),
					inline: true,
				},
				{
					name: translator.getText('inforolDashboardCountName'),
					value: `👤 x ${humansCount}\n🤖 x ${botsCount}`,
					inline: true,
				},
			);

		return replyOrUpdate({
			embeds: [embed],
			components,
		});
	} else {
		const pageStart = (page - 1) * MEMBERS_PER_PAGE;
		const pageEnd = pageStart + MEMBERS_PER_PAGE;

		const memberListContent = members
			.map((m) => (m.user.bot ? `${m} (🤖)` : `${m}`))
			.slice(pageStart, pageEnd)
			.join('\n');

		embed = new EmbedBuilder()
			.setColor(0xff00ff)
			.setTitle(translator.getText('inforolDetailTitle'))
			.setAuthor({
				name: translator.getText('commandByName', user.username),
				iconURL: user.displayAvatarURL(),
			})
			.setFooter({ text: `${page}/${lastPage}` })
			.addFields({
				name: translator.getText('inforolDetailMembersListName'),
				value: memberListContent,
			});
	}

	return replyOrUpdate({
		content: '',
		embeds: [embed],
		components,
	});
}

export default command;
