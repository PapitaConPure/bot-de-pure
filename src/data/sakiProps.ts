import type { SelectMenuComponentOptionData } from 'discord.js';
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const saki = {
	config: {
		welcome: true,
		welcomePing: true,
	},
	infr: {
		channels: {
			'1107845079927894026': '♠— Pseudo Paradise —♠',
			'1107831056532525108': '♠— Forest of Dolls —♠',
			'1107831056532525106': '🤖┊botposting',
			'1107837229348442122': '🔎┊traducciones',
			'1107831056129851475': '🤖┊autómatas',
			'813189609911353385': 'gachahell',
			'813195795318177802': 'trata-de-waifus',
			'1107837472869720084': '🥛┊tetaposting',
		},
		users: {},
	},
	warn: 0,
	images: {
		welcome: 'https://i.imgur.com/inyqr67.png',
		colors: 'https://i.imgur.com/7t7m3PS.png',
		forcecolors: 'https://i.imgur.com/eHbSCHK.png',
	},
	colorsList: [
		{
			emoteId: '819772377814532116',
			roleId: '1107840228066086952',
			roleName: 'French Doll',
			roleDesc: 'Rojo',
		},
		{
			emoteId: '819772377624870973',
			roleId: '1107843021510291496',
			roleName: 'Holland Doll',
			roleDesc: 'Azul',
		},
		{
			emoteId: '819772377482526741',
			roleId: '1107842992858996888',
			roleName: 'Tibetan Doll',
			roleDesc: 'Verde',
		},
		{
			emoteId: '819772377440583691',
			roleId: '1107843075323203735',
			roleName: 'Kyoto Doll',
			roleDesc: 'Púrpura',
		},
		{
			emoteId: '819772377856606228',
			roleId: '1107843093870428222',
			roleName: 'London Doll',
			roleDesc: 'Naranja',
		},
		{
			emoteId: '819772377894354944',
			roleId: '1107843120751710218',
			roleName: 'Russian Doll',
			roleDesc: 'Amarillo',
		},
		{
			emoteId: '819772377642041345',
			roleId: '1107843142608240720',
			roleName: 'Orléans Doll',
			roleDesc: 'Celeste',
		},
	],
	titaniaRoleId: '1107844381630799973',
	candyRoleId: '1107831054791876692',
	hangedRoleId: '1108101434152591380',
	crucifiedRoleId: '1108101561932066836',
	announcementChannelId: '1107831056129851478',
	crazyBackupChannelId: '1107837659247812669',
};

const roleList = (() => {
	const menuOptions: SelectMenuComponentOptionData[] = [];

	saki.colorsList.forEach((color) =>
		menuOptions.push({
			value: color.roleId,
			label: color.roleName,
			emoji: {
				name: color.roleName.slice(0, 3),
				id: color.emoteId,
			},
		}),
	);

	return new StringSelectMenuBuilder()
		.setCustomId('colores_addColor')
		.setPlaceholder('Escoge un color...')
		.addOptions(menuOptions);
})();

export const colorsRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleList);
