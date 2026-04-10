import type { GuildMember, PartialGuildMember } from 'discord.js';

export async function onGuildMemberUpdate(
	oldMember: GuildMember | PartialGuildMember,
	_newMember: GuildMember,
) {
	const { guild } = oldMember;

	if (!guild.available) return;

	//En deshuso
}
