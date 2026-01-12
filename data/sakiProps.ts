import { ActionRowBuilder, SelectMenuComponentOptionData, StringSelectMenuBuilder } from 'discord.js';
import { hourai } from './config.json';
const { colorsList } = hourai;

const roleList = (() => {
	const menuOptions: SelectMenuComponentOptionData[] = [];
	
	colorsList.forEach(color => menuOptions.push({
		value: color.roleId,
		label: color.roleName,
		emoji: {
			name: color.roleName.slice(0, 3),
			id: color.emoteId,
		},
	}));
	
	return new StringSelectMenuBuilder()
		.setCustomId('colores_addColor')
		.setPlaceholder('Escoge un color...')
		.addOptions(menuOptions);
})();

export const colorsRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleList);
