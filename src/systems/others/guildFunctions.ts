import type { Message } from 'discord.js';
import type { UserCache } from '@/utils/usercache';

export type GuildMessagePlugin = (message: Message<true>, userCache: UserCache) => void;

//Funciones de Respuesta Rápida personalizadas por servidor.
//Permite agregar plugins que se ejecutan en cada procesado de mensaje en servidores particulares.
//Para agregar un servidor, introduce su ID como clave y un objeto como valor.
//Cada campo del objeto debe ser una función, y representa un plugin para ese servidor.
export const guildMessagePlugins: Record<string, GuildMessagePlugin[]> = {
	// '1234567890': [
	//   () => {
	//     //(...)
	//   },
	//   () => {
	//     //(...)
	//   },
	// ],
	// '0987654321': [
	//   () => {
	//     //(...)
	//   },
	// ],
};

export async function processGuildPlugins(message: Message<true>, userCache: UserCache) {
	const guildFunctions = guildMessagePlugins[message.guild.id];

	if (!guildFunctions) return;

	return Promise.allSettled(guildFunctions.map((fgf) => fgf(message, userCache)));
}
