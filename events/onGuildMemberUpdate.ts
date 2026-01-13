import { GuildMember, PartialGuildMember } from 'discord.js';
import { saki } from '../data/sakiProps';
import serverIds from '../data/serverIds.json';

export async function onGuildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
	const { guild } = oldMember;
	if(!guild.available) return;

	if( guild.id !== serverIds.saki
	 || newMember.premiumSinceTimestamp === oldMember.premiumSinceTimestamp
	 || newMember.roles.cache.has(saki.titaniaRoleId)
	  ) return;

	return newMember.roles.add(saki.titaniaRoleId)
	.catch(console.error);
}
