import type { Message } from 'discord.js';

type GuildMessagePlugin = (message: Message) => void;

//Funciones de Respuesta Rápida personalizadas por servidor.
//Permite agregar plugins que se ejecutan en cada procesado de mensaje en servidores particulares.
//Para agregar un servidor, introduce su ID como clave y un objeto como valor.
//Cada campo del objeto debe ser una función, y representa un plugin para ese servidor.
const globalFunctions: Record<string, GuildMessagePlugin> = {
	// '1234567890': {
	//   function doSomethingVerySilly() {
	//     ...
	//   },
	//   function doSomethingElseRightAfter() {
	//     ...
	//   },
	// },
	// '0987654321': {
	//   function anotherServerPlugin() {
	//     ...
	//   },
	// },
};

export default globalFunctions;
