import type { GuildMember, PartialGuildMember } from 'discord.js';
import { sendFarewellMessage } from '@/func';
import { announceMemberUpdate, guildIsAvailable } from './guildMemberUpdate';

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
	console.log('Evento de salida de miembro de servidor desencadenado');
	
	if (!guildIsAvailable(member.guild)) return;

	announceMemberUpdate(member, 'farewell', sendFarewellMessage);
}
