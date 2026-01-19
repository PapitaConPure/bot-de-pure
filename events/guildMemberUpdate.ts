import Discord from 'discord.js';
import { globalConfigs } from '../data/globalProps';
import userIds from '../data/userIds.json';
import { channelIsBlocked } from '../func';

const guildBotUpdateText: Map<'dibujarBienvenida' | 'dibujarDespedida', (member: Discord.GuildMember | Discord.PartialGuildMember) => string> = new Map();
guildBotUpdateText
	.set('dibujarBienvenida', member => `Se acaba de unir un bot.\n***${member} Beep boop, boop beep?***`)
	.set('dibujarDespedida',  member => `**${member.displayName}** ya no es parte de la pandilla de bots de este servidor :[`);

export function guildIsAvailable(guild: Discord.Guild) {
	if(!guild.available || !guild.systemChannelId) return false;
	const systemChannel = guild.channels.cache.get(guild.systemChannelId);
	return systemChannel && systemChannel.isTextBased() && !channelIsBlocked(systemChannel);
}

function handleError(error: Error, guild: Discord.Guild, user: Discord.User, errorMessage?: string) {
	errorMessage && console.log(errorMessage);
	console.error(error);
	const errorEmbed = new Discord.EmbedBuilder()
		.setColor(0x0000ff)
		.setAuthor({ name: guild.name })
		.setFooter({ text: `gid: ${guild.id} | uid: ${user.id}` })
		.addFields({ name: errorMessage || 'Error', value: `\`\`\`\n${error.name || 'error desconocido'}:\n${error.message || 'sin mensaje'}\n\`\`\`` });
	globalConfigs.logch.send({
		content: `<@${userIds.papita}>`,
		embeds: [ errorEmbed ],
	});
}

export function announceMemberUpdate(member: Discord.GuildMember | Discord.PartialGuildMember, fn: Function) {
	const { user, guild } = member;
	try {
		if(!user.bot)
			return fn(member);

		return guild.systemChannel.send({
			content: guildBotUpdateText.get(fn.name as 'dibujarBienvenida'|'dibujarDespedida')(member),
		}).catch(console.error);
	} catch(error) {
		handleError(error, guild, user);
	}
}
