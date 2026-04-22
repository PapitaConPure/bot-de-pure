import type { GuildMember } from 'discord.js';
import { sendWelcomeMessage } from '@/func';
import Logger from '@/utils/logs.js';
import { announceMemberUpdate, guildIsAvailable } from './guildMemberUpdate';

const { debug } = Logger('DEBUG', 'GMemberAdd');

export async function onGuildMemberAdd(member: GuildMember) {
	debug(`Evento disparado - ${member.user.username} → ${member.guild.name} (${member.guild.id})`);
	if (!guildIsAvailable(member.guild)) return;
	announceMemberUpdate(member, 'welcome', sendWelcomeMessage);
}
