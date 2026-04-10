import type { Guild, GuildMember, PartialGuildMember, User } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { channelIsBlocked } from '@/func';
import { globalConfigs } from '../data/globalProps';
import userIds from '../data/userIds.json';

const guildBotUpdateText: Map<
	'dibujarBienvenida' | 'dibujarDespedida',
	(member: GuildMember | PartialGuildMember) => string
> = new Map();
guildBotUpdateText
	.set(
		'dibujarBienvenida',
		(member) => `Se acaba de unir un bot.\n***${member} Beep boop, boop beep?***`,
	)
	.set(
		'dibujarDespedida',
		(member) =>
			`**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[`,
	);

export function guildIsAvailable(guild: Guild) {
	if (!guild.available || !guild.systemChannelId) return false;
	const systemChannel = guild.channels.cache.get(guild.systemChannelId);
	return systemChannel?.isTextBased() && !channelIsBlocked(systemChannel);
}

function handleError(error: Error, guild: Guild, user: User, errorMessage?: string) {
	errorMessage && console.log(errorMessage);
	console.error(error);
	const errorEmbed = new EmbedBuilder()
		.setColor(0x0000ff)
		.setAuthor({ name: guild.name })
		.setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
		.addFields({
			name: errorMessage || 'Error',
			value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\``,
		});
	globalConfigs.logch.send({
		content: `<@${userIds.papita}>`,
		embeds: [errorEmbed],
	});
}

export function announceMemberUpdate<TMember extends GuildMember | PartialGuildMember>(
	member: TMember,
	fn: (member: TMember) => unknown,
) {
	const { user, guild } = member;
	try {
		if (!user.bot) return fn(member);

		return guild.systemChannel
			.send({
				content: guildBotUpdateText.get(
					fn.name as 'dibujarBienvenida' | 'dibujarDespedida',
				)(member),
			})
			.catch(console.error);
	} catch (error) {
		handleError(error, guild, user);
	}
}
