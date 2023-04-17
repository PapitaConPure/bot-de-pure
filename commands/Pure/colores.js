const { CommandMetaFlagsManager, CommandManager } = require('../Commons/commands');
const { hourai } = require('../../localdata/config.json');
const { colorsRow } = require('../../localdata/houraiProps');
const { colorsList } = hourai;

const flags = new CommandMetaFlagsManager().add(
	'HOURAI',
	'OUTDATED',
);
const command = new CommandManager('colores', flags)
	.setAliases(
		'color',
		'colours', 'colour', 'colors',
	)
	.setLongDescription('Muestra un tablón de roles de colores básicos para Hourai Doll')
	.setExecution(async request => {
		return request.reply({
			content: `Aquí teni los colore po **${(request.user ?? request.author).username}** <:reibu:686220828773318663>`,
			files: [hourai.images.colors],
			components: [colorsRow],
			ephemeral: true,
		});
	})
	.setSelectMenuResponse(async function addColor(interaction) {
		const { guild, member } = interaction;
        const role = guild.roles.cache.get(interaction.values[0]);
        if(!role)
			return interaction.reply({ content: '❌ No se encontró el rol. Si lo intentas más tarde, puede que el problema se haya solucionado', ephemeral: true });
		
		const hadroles = member.roles.cache.find(mr => colorsList.some(color => color.roleId === mr.id));
		if(hadroles == undefined) {
			await member.roles.add(role);
			return interaction.reply({ content: 'Colores otorgados <:miyoi:674823039086624808> 👍', ephemeral: true });
		}

		await member.roles.remove(hadroles);
		await member.roles.add(role);
		return interaction.reply({ content: 'Colores intercambiados <:monowo:887389799042932746>', ephemeral: true });
	});

module.exports = command;