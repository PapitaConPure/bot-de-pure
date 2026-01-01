const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { makeStringSelectMenuRowBuilder } = require('../utils/tsCasts');
const { hourai } = require('./config.json');
const { colorsList } = hourai;

const roleList = (() => {
	const menuOptions = [];
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

const colorsRow = makeStringSelectMenuRowBuilder().addComponents(roleList);

module.exports = {
    colorsRow,
};
