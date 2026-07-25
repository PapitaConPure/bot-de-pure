import type { GuildMember, PartialGuildMember } from 'discord.js';
import { sendFarewellMessage } from '@/utils/announcements';
import Logger from '@/utils/logs.js';
import { announceMemberUpdate, guildIsAvailable } from './guildMemberUpdate';

const { debug } = Logger('DEBUG', 'GMemberRemove');

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
	debug(`Evento disparado - ${member.user.username} ← ${member.guild.name} (${member.guild.id})`);
	if (!guildIsAvailable(member.guild)) return;
	announceMemberUpdate(member, 'farewell', sendFarewellMessage);
}
