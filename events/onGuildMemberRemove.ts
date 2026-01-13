import { GuildMember, PartialGuildMember } from 'discord.js';
import { dibujarDespedida } from '../func';
import { guildIsAvailable, announceMemberUpdate } from './guildMemberUpdate';

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
	console.log('Evento de salida de miembro de servidor desencadenado');
	if(!guildIsAvailable(member.guild)) return;
	if(member.user.id === '239550977638793217')
		return member.guild.systemChannel.send('Se fue el bigote');
	announceMemberUpdate(member, dibujarDespedida);
}
