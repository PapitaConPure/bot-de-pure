import { CommandTags, Command } from '../Commons/';
import { saki, colorsRow } from '../../data/sakiProps';
const { colorsList } = saki;

const tags = new CommandTags().add(
	'SAKI',
	'OUTDATED',
);

const command = new Command('colores', tags)
	.setAliases(
		'color',
		'colours', 'colour', 'colors',
	)
	.setLongDescription('Muestra un tablón de roles de colores básicos para Saki Scans')
	.setExecution(async request => {
		return request.reply({
			content: `Aquí teni los colore po **${request.user.username}** <:reibu:1107876018171162705>`,
			files: [ saki.images.colors ],
			components: [ colorsRow ],
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
			return interaction.reply({ content: 'Colores otorgados <:miyoi:1107848008005062727> 👍', ephemeral: true });
		}

		await member.roles.remove(hadroles);
		await member.roles.add(role);
		return interaction.reply({ content: 'Colores intercambiados <:monowo:1108315840404803624>', ephemeral: true });
	});

export default command;
